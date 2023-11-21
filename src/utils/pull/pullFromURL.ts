import downloadFile from "../downloadFile";
import type { Target } from "../target";
import makeTarget from "../target";
import { EPullResult, PullOptions } from "./types";
import pullFromDisk from "./pullFromDisk";

/**
 * Pull from URL.
 *
 * Raise NotFoundError for 404 errors.
 * Raise HeaderNotFoundError if there is no header file.
 * @param {PullFromURLOptions} options - options
 * @returns the result
 */
export async function pullFromURL(
    target: Target,
    options?: PullOptions
): Promise<EPullResult> {
    // Download to a temporary file
    await downloadFile(
        target.url,
        {
            timeout: options?.timeout,
        },
        async (tmpPath) => {
            await pullFromDisk(makeTarget(tmpPath), options);
        }
    );

    return Promise.resolve(EPullResult.Downloaded);
}
