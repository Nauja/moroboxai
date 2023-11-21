import { NotFoundError } from "../errors";
import getSources from "../getSources";
import isInstalled from "../isInstalled";
import type { Target } from "../target";
import makeTarget from "../target";
import pullFromDisk from "./pullFromDisk";
import { pullFromURL } from "./pullFromURL";
import type { PullOptions, SourcesOptions } from "./types";
import { EPullResult } from "./types";

async function* getTargets(
    id: string,
    options: Partial<SourcesOptions>
): AsyncGenerator<Target, void, void> {
    for await (const source of getSources(options)) {
        yield makeTarget(source, id);
    }
}

/**
 * Pull from sources in sources.list.
 *
 * Raise NotFoundError if not found.
 * @param {PullFromSourcesOptions} options - options
 * @returns the result
 */
export async function pullFromSources(
    target: Target,
    options?: PullOptions
): Promise<EPullResult> {
    // Skip if already downloaded.
    // The download is always forced when unpack is true or output is set.
    if (
        options?.unpack !== true &&
        options?.output === undefined &&
        options?.force !== true &&
        isInstalled(target.id, { builtinDirsOnly: true })
    ) {
        console.debug("Already installed");
        return Promise.resolve(EPullResult.AlreadyDownloaded);
    }

    console.log(`Pulling ${target.id}...`);

    // If the target exists locally
    if (!target.isRemote()) {
        return await pullFromDisk(target, options);
    }

    // If the target is a direct URL
    if (target.isURL()) {
        return await pullFromURL(target, options);
    }

    // Target is an id
    for await (const sourceTarget of getTargets(`${target.id}.zip`, {
        sources: target.sources ?? options?.sources,
        extraSources: target.extraSources ?? options?.extraSources,
    })) {
        console.log(`Source ${sourceTarget.toString()}`);
        try {
            // If the target exists locally
            if (!sourceTarget.isRemote()) {
                return await pullFromDisk(sourceTarget, options);
            }

            // If the target is a direct URL
            if (sourceTarget.isURL()) {
                return await pullFromURL(sourceTarget, options);
            }
        } catch (err) {
            console.debug(err);
        }
    }

    throw new NotFoundError(target.id);
}
