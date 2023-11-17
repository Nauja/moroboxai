import * as fs from "fs";
import * as nodePath from "path";
import * as StreamZip from "node-stream-zip";
import * as archiver from "archiver";
import * as yaml from "yaml";
import {
    NotFoundError,
    HeaderNotFoundError,
    isENOENT,
    CantUnpackError,
    CantPackError,
} from "./errors";
import { CWD } from "./platform";
import installPaths from "./installPaths";

export interface PackOptions {
    // Output path
    output?: string;
}

export interface UnpackOptions {
    // Output path
    output?: string;
}

export interface Header {
    type?: "game" | "boot" | "agent";
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
    // Pack to archive
    pack: (options: PackOptions) => Promise<void>;
    /**
     * Unpack from archive.
     *
     * Raise CantUnpackError if not packed.
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
                .then((data) => resolve(yaml.parse(data.toString()) as Header))
                .catch(() => reject(new HeaderNotFoundError(this._path)));
        });
    }

    async size(): Promise<number> {
        return Promise.resolve(fs.statSync(this._path).size);
    }

    pack(): Promise<void> {
        throw new CantPackError(this.id, "not a directory");
    }

    async unpack(options?: UnpackOptions): Promise<void> {
        let dst = options.output ?? CWD;
        if (!nodePath.isAbsolute(dst)) {
            dst = nodePath.join(CWD, dst);
        }

        if (fs.existsSync(dst)) {
            dst = nodePath.join(dst, this.id);
        }

        console.log(`Unpack to ${dst}`);
        await this._zip.extract(null, dst);
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

                    return resolve(yaml.parse(data.toString()) as Header);
                }
            );
        });
    }

    async size(): Promise<number> {
        return Promise.resolve(0);
    }

    pack(options: PackOptions): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            let dst = options.output ?? `${this.id}.zip`;
            if (!nodePath.isAbsolute(dst)) {
                dst = nodePath.join(CWD, dst);
            }

            console.log(`Pack to ${dst}`);

            const output = fs.createWriteStream(dst);
            const archive = archiver("zip", { zlib: { level: 9 } });
            output.on("close", () => {
                console.log(`${archive.pointer()} bytes packed`);
                return resolve();
            });

            archive.on("error", reject);

            archive.pipe(output);
            archive.directory(this._root, false);
            await archive.finalize();
        });
    }

    unpack(): Promise<void> {
        throw new CantUnpackError(this.id, "not an archive");
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

/**
 * Open a game, boot, or agent, for reading.
 *
 * Raise NotFoundError if the game is not found.
 * Raise HeaderNotFoundError if the header is not found.
 * @returns reader
 */
export default async function open(
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
