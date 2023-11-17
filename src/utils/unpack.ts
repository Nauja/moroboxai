import open from "./open";

/**
 * Options for unpack.
 */
export interface UnpackOptions {
    // Id or path of the target
    target: string;
    // Destination directory
    output?: string;
}

/**
 * Unpack a game, boot, or agent.
 *
 * Raise NotFoundError if the target is not found.
 * Raise CantUnpackError if the target is not packed.
 * @param {PullBootOptions} options - options
 */
export default async function unpack(options: UnpackOptions) {
    await open({ target: options.target }, async (reader) => {
        await reader.unpack({ output: options.output });
    });
}
