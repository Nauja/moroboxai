import * as fs from "fs";
import * as nodePath from "path";
import * as StreamZip from "node-stream-zip";
import * as archiver from "archiver";
import * as yaml from "yaml";
import { NotFoundError, HeaderNotFoundError, isENOENT } from "./errors";
import { CWD } from "./platform";
import installPaths from "./installPaths";
import makeAbsolute from "./makeAbsolute";
import outputPath from "./outputPath";

export interface PackOptions {
    output?: string;
}

export interface UnpackOptions {
    output?: string;
}

export interface Header {
    type?: "game" | "boot" | "agent";
    id?: string;
}

export interface IReader {
    // Id of the element
    readonly id: string;
    // If an archive
    readonly isArchive: boolean;
    // If a directory
    readonly isDirectory: boolean;
    /**
     * Load the header.
     *
     * Raise HeaderNotFoundError if the header is not found.
     */
    loadHeader: () => Promise<Header>;
    // Get the size of the archive or directory
    size: () => Promise<number>;
    /**
     * Pack the target.
     * @param {PackOptions} options - options
     */
    pack: (options?: PackOptions) => Promise<void>;
    /**
     * Unpack the target.
     * @param {UnpackOptions} options - options
     */
    unpack: (options?: UnpackOptions) => Promise<void>;
    // Close
    close: () => Promise<void>;
    // Remove from disk
    remove: () => Promise<void>;
}

/**
 * Reader for .zip archives.
 */
class ZIPReader implements IReader {
    private _id: string;
    private _path: string;
    private _zip: StreamZip.StreamZipAsync;

    /**
     * Initialize the reader.
     * @param {string} path - path of the game
     * @param {StreamZip.StreamZipAsync} zip - archive
     */
    constructor(path: string, zip: StreamZip.StreamZipAsync) {
        this._id = nodePath.parse(path).name;
        this._path = path;
        this._zip = zip;
    }

    get id(): string {
        return this._id;
    }

    get isArchive(): boolean {
        return true;
    }

    get isDirectory(): boolean {
        return false;
    }

    async loadHeader(): Promise<Header> {
        return new Promise<Header>((resolve, reject) => {
            this._zip
                .entryData("header.yml")
                .then((data) => {
                    const header = yaml.parse(data.toString()) as Header;
                    this._id = header.id;
                    return resolve(header);
                })
                .catch(() => reject(new HeaderNotFoundError(this._path)));
        });
    }

    async size(): Promise<number> {
        return Promise.resolve(fs.statSync(this._path).size);
    }

    pack(options?: PackOptions): Promise<void> {
        const output = outputPath(`${this.id}.zip`, options.output);
        console.debug(`Pack to ${output}`);
        fs.copyFileSync(this._path, output);
        return Promise.resolve();
    }

    async unpack(options?: UnpackOptions): Promise<void> {
        let output = outputPath("", options.output);
        if (fs.existsSync(output)) {
            output = nodePath.join(output, this.id);
        }

        console.log(`Unpack to ${output}`);
        await this._zip.extract(null, output);
    }

    async close(): Promise<void> {
        await this._zip.close();
    }

    remove(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            // Make sure to close the archive before
            await this.close();

            // Try to remove
            fs.rm(this._path, { force: true }, (err) => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    }
}

/**
 * Reader for directories.
 */
class DirectoryReader implements IReader {
    private _id: string;
    private _root: string;

    /**
     * Initialize the reader.
     * @param {string} root - root path
     */
    constructor(root: string) {
        this._id = nodePath.parse(root).name;
        this._root = root;
    }

    get id(): string {
        return this._id;
    }

    get isArchive(): boolean {
        return false;
    }

    get isDirectory(): boolean {
        return true;
    }

    async loadHeader(): Promise<Header> {
        return new Promise<Header>((resolve, reject) => {
            fs.readFile(
                nodePath.join(this._root, "header.yml"),
                (err, data) => {
                    if (err) {
                        if (isENOENT(err)) {
                            return reject(new HeaderNotFoundError(this.id));
                        }

                        return reject(err);
                    }

                    const header = yaml.parse(data.toString()) as Header;
                    this._id = header.id;
                    return resolve(header);
                }
            );
        });
    }

    async size(): Promise<number> {
        return Promise.resolve(0);
    }

    pack(options?: PackOptions): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const output = outputPath(`${this.id}.zip`, options.output);
            console.log(`Pack to ${output}`);

            const wstream = fs.createWriteStream(output);
            const archive = archiver("zip", { zlib: { level: 9 } });
            wstream.on("close", () => {
                console.log(`${archive.pointer()} bytes packed`);
                return resolve();
            });

            archive.on("error", reject);

            archive.pipe(wstream);
            archive.directory(this._root, false);
            await archive.finalize();
        });
    }

    unpack(options?: UnpackOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let output = outputPath("", options.output);
            if (fs.existsSync(output)) {
                output = nodePath.join(output, this.id);
            }

            fs.readdir(this._root, { recursive: true }, (err, files) => {
                if (err) {
                    return reject(err);
                }

                files.forEach((file) => {
                    console.log(
                        "Copy from",
                        nodePath.join(this._root, file),
                        " to ",
                        nodePath.join(output, file)
                    );
                    fs.copyFileSync(
                        nodePath.join(this._root, file),
                        nodePath.join(output, file)
                    );
                });

                return resolve();
            });
        });
    }

    async close(): Promise<void> {}

    remove(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            // Remove with rf
            fs.rm(this._root, { recursive: true, force: true }, (err) => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    }
}

export interface OpenOptions {
    // Id or path of the target
    target: string;
    // Only searches in builtin directories
    builtinDirsOnly?: boolean;
}

async function createReader(
    options: OpenOptions,
    callback: (reader: IReader) => Promise<void>
) {
    let reader: IReader = null;

    for (const path of installPaths({
        target: options.target,
        builtinDirsOnly: options.builtinDirsOnly,
    })) {
        if (!fs.existsSync(path)) {
            continue;
        }

        if (path.endsWith(".zip")) {
            const zip = new StreamZip.async({ file: path });
            reader = new ZIPReader(path, zip);
            break;
        }

        // Test directory
        reader = new DirectoryReader(path);
        break;
    }

    if (reader === null) {
        throw new NotFoundError(options.target);
    }

    try {
        await callback(reader);
    } finally {
        try {
            await reader.close();
        } catch (err) {
            console.debug("Could not close reader", err);
        }
    }
}

/**
 * Open a game, boot, or agent, for reading.
 *
 * Raise NotFoundError if the game is not found.
 * Raise HeaderNotFoundError if the header is not found.
 * @returns reader
 */
export default function open(
    options: OpenOptions,
    callback: (reader: IReader) => Promise<void>
) {
    return createReader(options, async (reader) => {
        await reader.loadHeader();
        await callback(reader);
    });
}
