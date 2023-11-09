import * as fs from "fs";
import * as nodePath from "path";
import * as StreamZip from "node-stream-zip";
import * as archiver from "archiver";
import { GameHeader } from "moroboxai-game-sdk";
import {
    GameNotFoundError,
    GameHeaderNotFoundError,
    isENOENT,
    CantUnpackError,
    CantPackError,
} from "./errors";
import { CWD, GAMES_DIR } from "./platform";
import isID from "./isID";
import outputFile from "./outputFile";

export interface PackOptions {
    // Output path
    output?: string;
}

export interface IGameReader {
    // Id of the game
    readonly id: string;
    // If the game is in an archive
    readonly isArchive: boolean;
    // If the game is in a directory
    readonly isDirectory: boolean;
    /**
     * Load the game header.
     *
     * Raise GameHeaderNotFoundError if the header is not found.
     */
    loadHeader: () => Promise<GameHeader>;
    // Get the size of the game
    size: () => Promise<number>;
    // Pack the game
    pack: (options: PackOptions) => Promise<void>;
    /**
     * Unpack the game.
     *
     * Raise CantUnpackError if the game is not packed.
     */
    unpack: (dst: string) => Promise<void>;
    // Close the game
    close: () => Promise<void>;
}

/**
 * Reader for games archived as .zip.
 */
class ZIPGameReader implements IGameReader {
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

    async loadHeader(): Promise<GameHeader> {
        return new Promise<GameHeader>((resolve, reject) => {
            this._zip
                .entryData("header.yml")
                .then((data) => resolve(data.toJSON() as GameHeader))
                .catch(() => reject(new GameHeaderNotFoundError(this.id)));
        });
    }

    async size(): Promise<number> {
        return Promise.resolve(fs.statSync(this._path).size);
    }

    pack(): Promise<void> {
        throw new CantPackError(this.id, "not a directory");
    }

    async unpack(dst: string): Promise<void> {
        await this._zip.extract(null, dst);
    }

    async close(): Promise<void> {
        await this._zip.close();
    }
}

/**
 * Reader for games in directories.
 */
class DirectoryGameReader implements IGameReader {
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

    async loadHeader(): Promise<GameHeader> {
        return new Promise<GameHeader>((resolve, reject) => {
            fs.readFile(
                nodePath.join(this._root, "header.yml"),
                (err, data) => {
                    if (err) {
                        if (isENOENT(err)) {
                            return reject(new GameHeaderNotFoundError(this.id));
                        }

                        return reject(err);
                    }

                    return resolve(data.toJSON() as GameHeader);
                }
            );
        });
    }

    async size(): Promise<number> {
        return Promise.resolve(0);
    }

    pack(options: PackOptions): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const dst = outputFile(options.output ?? CWD, `${this.id}.zip`);
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
}

/**
 * Return the possible paths for a game.
 * @param {string} game - id or path of the game
 */
function* gamePaths(game: string): Generator<string, void, void> {
    // Test the path itself
    yield game;

    // Test from the games dir
    yield nodePath.join(GAMES_DIR, `${game}.zip`);
}

export interface OpenGameOptions {
    // Id or path of the game
    game: string;
}

export enum EOpenGameError {
    NotFound,
}

/**
 * Open a game for reading.
 *
 * Raise GameNotFoundError if the game is not found.
 * Raise GameHeaderNotFoundError if the header is not found.
 * @returns reader
 */
export default async function openGame(
    options: OpenGameOptions
): Promise<IGameReader> {
    for (const path of gamePaths(options.game)) {
        if (!fs.existsSync(path)) {
            continue;
        }

        if (path.endsWith(".zip")) {
            const zip = new StreamZip.async({ file: path });
            return Promise.resolve(new ZIPGameReader(path, zip));
        }

        // Test directory
        return Promise.resolve(new DirectoryGameReader(path));
    }

    throw new GameNotFoundError(options.game);
}
