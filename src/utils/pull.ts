import * as fs from "fs";
import * as path from "path";
import {
    InvalidHeaderError,
    NotFoundError,
    UnexpectedArgumentError,
} from "./errors";
import downloadFile from "./downloadFile";
import getSources from "./getSources";
import outputFile from "./outputFile";
import isValidURL from "./isValidURL";
import open from "./open";
import isID from "./isID";
import unpack from "./unpack";
import isInstalled from "./isInstalled";
import { AGENTS_DIR, BOOTS_DIR, CWD, GAMES_DIR } from "./platform";

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
    // Unpack the archive
    unpack?: boolean;
    // Destination of the archive
    output?: string;
    // Timeout of the request
    timeout?: number;
}

/**
 * Pull from URL.
 *
 * Raise NotFoundError for 404 errors.
 * Raise HeaderNotFoundError if there is no header file.
 * @param {PullFromURLOptions} options - options
 * @returns the result
 */
async function pullFromURL(options: PullFromURLOptions): Promise<EPullResult> {
    // Download to a temporary file
    await downloadFile(
        {
            src: options.url,
            timeout: options.timeout,
        },
        async (tmpPath) => {
            // Open the archive
            await open(
                {
                    target: tmpPath,
                },
                async (reader) => {
                    // Try to read the header
                    const header = await reader.loadHeader();
                    if (header.type === undefined) {
                        throw new InvalidHeaderError("field type not defined");
                    }

                    // Find the correct builtin directory
                    let builtinDir: string = "";
                    switch (header.type) {
                        case "game":
                            builtinDir = GAMES_DIR;
                            break;
                        case "boot":
                            builtinDir = BOOTS_DIR;
                            break;
                        case "agent":
                            builtinDir = AGENTS_DIR;
                            break;
                        default:
                            throw new InvalidHeaderError("invalid type");
                    }

                    const filename = path.basename(options.url.pathname);
                    const id = path.parse(filename).name;
                    const output =
                        options.unpack === true
                            ? options.output ?? builtinDir
                            : outputFile(
                                  options.output ?? builtinDir,
                                  filename
                              );

                    if (options.unpack === true) {
                        // Optionally unpack the game to destination
                        const dst = path.join(output, id);
                        console.log(`Unpack to ${dst}...`);
                        await unpack({
                            target: tmpPath,
                            output: dst,
                        });
                    } else {
                        // Otherwise copy to destination
                        fs.copyFileSync(tmpPath, output);
                    }
                }
            );
        }
    );

    return Promise.resolve(EPullResult.Downloaded);
}

/**
 * Options for pullFromSources.
 */
export interface PullFromSourcesOptions {
    // Id of the file
    id: string;
    // The list of sources
    sources?: string[];
    // Additional sources
    extraSources?: string[];
    // Force downloading even if it exists
    force: boolean;
    // Unpack the archive
    unpack?: boolean;
    // Destination of the archive
    output?: string;
    // Timeout of the request
    timeout?: number;
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
    // Skip if already downloaded.
    // The download is always forced when unpack is true or output is set.
    if (
        options.unpack !== true &&
        options.output === undefined &&
        options.force !== true &&
        isInstalled(options.id)
    ) {
        return Promise.resolve(EPullResult.AlreadyDownloaded);
    }

    // Expect to download a .zip.
    const filename = `${options.id}.zip`;

    // Try each source URL
    for await (const source of getSources({
        sources: options.sources,
        extraSources: options.extraSources,
    })) {
        const url = new URL(filename, source);
        console.log(`Testing ${url.href}...`);
        try {
            return await pullFromURL({
                url,
                unpack: options.unpack,
                output: options.output,
                timeout: options.timeout,
            });
        } catch (err) {
            console.debug(err);
        }
    }

    throw new NotFoundError(options.id);
}

/**
 * Options for pullGame.
 */
export interface PullOptions {
    // Id or URL of the target
    target: string;
    // Force downloading even if the target exists
    force?: boolean;
    // Unpack the archive
    unpack?: boolean;
    // Destination of the archive
    output?: string;
    // Timeout of the request
    timeout?: number;
}

/**
 * Download a game, boot, or agent, from any known source.
 *
 * It is installed in the corresponding builtin directory, or to a custom
 * output directory if the option is set.
 *
 * Raise UnexpectedArgumentError for invalid argument.
 * Raise NotFoundError if not found.
 * @param {PullOptions} options - options
 */
export default async function pull(options: PullOptions): Promise<EPullResult> {
    if (isID(options.target)) {
        return pullFromSources({
            id: options.target,
            force: options.force,
            unpack: options.unpack,
            output: options.output,
            timeout: options.timeout,
        });
    }

    if (isValidURL(options.target)) {
        if (!options.target.endsWith(".zip")) {
            throw new UnexpectedArgumentError(
                "target",
                "URL should end with .zip"
            );
        }

        const i = options.target.lastIndexOf("/");
        return pullFromSources({
            id: path.parse(options.target.substring(i + 1)).name,
            // Fake source for downloading the target
            sources: [options.target.substring(0, i)],
            force: options.force,
            unpack: options.unpack,
            output: options.output,
            timeout: options.timeout,
        });
    }

    throw new UnexpectedArgumentError("target", "should be an id or URL");
}
