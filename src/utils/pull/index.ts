import type { Target } from "../target";
import makeTarget from "../target";
import { EPullResult } from "./types";
import type { PullOptions } from "./types";
import { pullFromSources } from "./pullFromSources";

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
export default async function pull(
    target: string | Target,
    options?: PullOptions
): Promise<EPullResult> {
    const result = await pullFromSources(makeTarget(target), options ?? {});
    if (result === EPullResult.Downloaded) {
        console.log("Installed");
    }

    return Promise.resolve(result);
}
