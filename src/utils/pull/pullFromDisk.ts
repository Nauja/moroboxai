import * as path from "path";
import { InvalidHeaderError } from "../errors";
import open from "../open";
import { AGENTS_DIR, BOOTS_DIR, CWD, GAMES_DIR } from "../platform";
import type { Target } from "../target";
import type { PullOptions } from "./types";
import { EPullResult } from "./types";

/**
 * Pull from disk.
 *
 * Raise NotFoundError for 404 errors.
 * Raise HeaderNotFoundError if there is no header file.
 * @param {PullFromDiskOptions} options - options
 * @returns the result
 */
export default async function pullFromDisk(
    target: Target,
    options?: PullOptions
): Promise<EPullResult> {
    // Open the archive
    await open(
        {
            target: target.path,
        },
        async (reader) => {
            // Try to read the header
            const header = await reader.loadHeader();
            if (header.type === undefined) {
                throw new InvalidHeaderError(
                    "field type not defined in header"
                );
            }

            if (header.id === undefined) {
                throw new InvalidHeaderError("field id not defined in header");
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

            if (options?.unpack === true) {
                // Unpack the game if option is set.
                // By default, unpack to CWD.
                await reader.unpack({
                    output: options?.output,
                });
            } else {
                // Otherwise, pack the game to install it.
                // By default, install to the builtin directory.
                await reader.pack({
                    output:
                        options?.output ??
                        path.join(builtinDir, `${header.id}.zip`),
                });
            }
        }
    );

    return Promise.resolve(EPullResult.Downloaded);
}
