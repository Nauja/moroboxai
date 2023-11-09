import * as fs from "fs";
import * as path from "path";
import {
    NotFoundError,
    GameNotFoundError,
    UnexpectedArgumentError,
} from "./errors";
import downloadFile from "./downloadFile";
import getSources from "./getSources";
import { GAMES_DIR } from "./platform";
import outputFile from "./outputFile";
import isValidURL from "./isValidURL";
import isID from "./isID";
import unpackGame from "./unpackGame";

export enum EPullResult {
    Downloaded,
    AlreadyDownloaded,
}

/**
 * Options for pullFromURL.
 */
export interface PullFromURLOptions {
    // URL of the file
    url: URL;
    // Destination of the archive
    output: string;
    // Force downloading even if it exists
    force: boolean;
    // Unpack the archive
    unpack: boolean;
}

/**
 * Pull from URL.
 *
 * Raise GameNotFoundError for 404 errors.
 * @param {PullFromURLOptions} options - options
 * @returns the result
 */
async function pullFromURL(options: PullFromURLOptions): Promise<EPullResult> {
    const filename = path.basename(options.url.pathname);
    const id = path.parse(filename).name;

    // Skip if already downloaded.
    // The download is always forced when unpack is true.
    if (
        options.unpack !== true &&
        options.force !== true &&
        fs.existsSync(options.output)
    ) {
        return Promise.resolve(EPullResult.AlreadyDownloaded);
    }

    try {
        // Download to a temporary file
        await downloadFile({
            src: options.url,
            callback: async (tmpPath) => {
                if (options.unpack === true) {
                    // Optionally unpack the game to destination
                    const dst = path.join(options.output, id);
                    console.log(`Unpack to ${dst}...`);
                    await unpackGame({
                        game: tmpPath,
                        output: dst,
                    });
                } else {
                    // Otherwise copy to destination
                    fs.copyFileSync(tmpPath, options.output);
                }
            },
        });

        return Promise.resolve(EPullResult.Downloaded);
    } catch (err) {
        if (err instanceof NotFoundError) {
            throw new GameNotFoundError(id);
        }

        throw err;
    }
}

/**
 * Options for pullFromSources.
 */
export interface PullFromSourcesOptions {
    // Id of the file
    id: string;
    // Destination of the archive
    output: string;
    // The list of sources
    sources?: string[];
    // Additional sources
    extraSources?: string[];
    // Force downloading even if it exists
    force: boolean;
    // Unpack the archive
    unpack: boolean;
}

/**
 * Pull from sources in sources.list.
 *
 * Raise GameNotFoundError if not found.
 * @param {PullFromSourcesOptions} options - options
 * @returns the result
 */
async function pullFromSources(
    options: PullFromSourcesOptions
): Promise<EPullResult> {
    const filename = `${options.id}.zip`;
    const dst =
        options.unpack === true
            ? // Destination must be a directory when unpack is true
              options.output
            : outputFile(options.output, filename);

    // Skip if already downloaded.
    // The download is always forced when unpack is true.
    if (
        options.unpack !== true &&
        options.force !== true &&
        fs.existsSync(dst)
    ) {
        return Promise.resolve(EPullResult.AlreadyDownloaded);
    }

    for await (const source of getSources({
        sources: options.sources,
        extraSources: options.extraSources,
    })) {
        const url = new URL(filename, source);
        console.log(`Testing ${url.href}...`);
        try {
            return await pullFromURL({
                url,
                output: dst,
                force: true,
                unpack: options.unpack,
            });
        } catch (err) {
            console.error(err);
        }
    }

    throw new NotFoundError(options.id);
}

/**
 * Options for pull.
 */
export interface PullOptions {
    // Id or URL to pull
    src: string;
    // Destination of the archive
    output: string;
    // Force downloading even if it exists
    force?: boolean;
    // Unpack the archive
    unpack?: boolean;
}

export async function pull(options: PullOptions): Promise<EPullResult> {
    if (isID(options.src)) {
        return pullFromSources({
            id: options.src,
            output: options.output,
            force: options.force,
            unpack: options.unpack,
        });
    }

    if (isValidURL(options.src)) {
        if (!options.src.endsWith(".zip")) {
            throw new UnexpectedArgumentError(
                "src",
                "URL should end with .zip"
            );
        }

        const i = options.src.lastIndexOf("/");
        return pullFromSources({
            id: path.parse(options.src.substring(i + 1)).name,
            output: options.output,
            // Fake source for downloading the game
            sources: [options.src.substring(0, i)],
            force: options.force,
            unpack: options.unpack,
        });
    }

    throw new UnexpectedArgumentError("src", "should be an id or URL");
}

/**
 * Options for pullGame.
 */
export interface PullGameOptions {
    // Id or URL of the game
    game: string;
    // Force downloading even if the game exists
    force?: boolean;
    // Destination of the archive
    output?: string;
    // Unpack the archive
    unpack?: boolean;
}

/**
 * Download a game from any known source.
 *
 * Raise UnexpectedArgumentError for invalid game argument.
 * Raise GameNotFoundError if the game is not found.
 * @param {PullGameOptions} options - options
 */
export default async function pullGame(
    options: PullGameOptions
): Promise<EPullResult> {
    try {
        return await pull({
            src: options.game,
            force: options.force,
            output: options.output ?? GAMES_DIR,
            unpack: options.unpack,
        });
    } catch (err) {
        // Translate errors
        if (err instanceof UnexpectedArgumentError) {
            throw new UnexpectedArgumentError("game", err.reason);
        }

        throw err;
    }
}
