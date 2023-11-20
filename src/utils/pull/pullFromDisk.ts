import * as fs from "fs";
import * as path from "path";
import { InvalidHeaderError } from "../errors";
import outputFile from "../outputFile";
import open from "../open";
import unpack from "../unpack";
import { AGENTS_DIR, BOOTS_DIR, GAMES_DIR } from "../platform";
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
    options: PullOptions
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

            const output =
                options.unpack === true
                    ? options.output ?? builtinDir
                    : outputFile(
                          options.output ?? builtinDir,
                          `${target.id}.zip`
                      );

            if (options.unpack === true) {
                // Optionally unpack the game to destination
                const dst = path.join(output, target.id);
                console.log(`Unpack to ${dst}...`);
                await unpack({
                    target: target.path,
                    output: dst,
                });
            } else {
                // Otherwise copy to destination
                fs.copyFileSync(target.path, output);
            }
        }
    );

    return Promise.resolve(EPullResult.Downloaded);
}
