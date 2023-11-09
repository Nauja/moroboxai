import * as fs from "fs";
import { GameHeader } from "moroboxai-game-sdk";
import * as StreamZip from "node-stream-zip";
import * as path from "path";
import * as yaml from "yaml";
import * as model from "../model";
import * as ZipAPI from "./zip";

export interface IGameLoader {
    // loaded game header
    readonly header: GameHeader;

    // dispose resources
    close(): void;

    loadIcon(): Promise<Buffer>;

    loadPreview(): Promise<Buffer>;

    loadFile(file: string): Promise<Buffer>;
}

class GameFromDirectoryLoader implements IGameLoader {
    private _root: string;
    private _header: GameHeader;

    constructor(root: string, header: GameHeader) {
        this._root = root;
        this._header = header;
    }

    get header(): GameHeader {
        return this._header;
    }

    close(): void {
        // pass
    }

    loadIcon(): Promise<Buffer> {
        return this.loadFile(this._header.previewUrl);
    }

    loadPreview(): Promise<Buffer> {
        return this.loadFile(this._header.previewUrl);
    }

    loadFile(file: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve) =>
            resolve(fs.readFileSync(path.join(this._root, file)))
        );
    }
}

class GameFromZipLoader implements IGameLoader {
    private _zip: StreamZip;
    private _header: GameHeader;

    constructor(zip: StreamZip, header: GameHeader) {
        this._zip = zip;
        this._header = header;
    }

    get header(): GameHeader {
        return this._header;
    }

    close(): void {
        this._zip.close();
    }

    loadIcon(): Promise<Buffer> {
        return this.loadFile(this._header.previewUrl);
    }

    loadPreview(): Promise<Buffer> {
        return this.loadFile(this._header.previewUrl);
    }

    loadFile(file: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve) =>
            resolve(ZipAPI.readZipEntry(this._zip, file))
        );
    }
}

export function parseHeader(src: string): GameHeader {
    const header = yaml.parse(src);
    if (header.id === undefined) {
        throw new Error("skip header without id attribute");
    }

    if (header.boot === undefined) {
        throw new Error("skip header without boot attribute");
    }

    return header as GameHeader;
}

/**
 * List the games from a directory.
 * @param {string} root - Parent directory.
 * @param {function} gameFound - Function called for each game.
 * @returns {Promise} When all games have been processed
 */
export function listGames(
    root: string,
    gameFound: (game: IGameLoader) => void
): Promise<void> {
    // check if a zip contains header.json
    function checkZip(file): Promise<void> {
        return new Promise<void>((resolve) => {
            ZipAPI.loadZip(file, (err, zip) => {
                if (err) {
                    return resolve();
                }

                try {
                    const data = ZipAPI.readZipEntry(zip, model.HEADER_NAME);
                    const header = parseHeader(data.toString());
                    gameFound(new GameFromZipLoader(zip, header));
                } catch (e) {
                    console.error(e);
                }

                return resolve();
            });
        });
    }

    // check if a directory contains header.json
    function checkDirectory(file): Promise<void> {
        return new Promise<void>((resolve) => {
            fs.readFile(path.join(file, model.HEADER_NAME), (err, data) => {
                if (err) {
                    return resolve();
                }

                try {
                    const header = parseHeader(data.toString());
                    gameFound(new GameFromDirectoryLoader(file, header));
                } catch (e) {
                    console.error(e);
                }

                return resolve();
            });
        });
    }

    return new Promise((resolve, reject) => {
        fs.readdir(root, (err, files) => {
            // couldn't access the directory
            if (err) {
                return reject(err);
            }

            const tasks = new Array<Promise<void>>();
            files.forEach((_) => {
                if (_ === model.HEADER_NAME) {
                    // the root directory is a game itself
                    tasks.push(checkDirectory(root));
                } else if (_.endsWith(".zip")) {
                    // found a potentially zipped game
                    tasks.push(checkZip(_));
                } else {
                    // maybe a directory containing a game
                    tasks.push(checkDirectory(_));
                }
            });

            // run everything concurrently
            return Promise.all(tasks).then(() => resolve());
        });
    });
}
