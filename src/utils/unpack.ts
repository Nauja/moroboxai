import open from "./open";

/**
 * Options for unpack.
 */
export interface UnpackOptions {
    // Destination directory
    output?: string;
}

/**
 * Unpack a game, boot, or agent.
 *
 * Raise NotFoundError if the target is not found.
 * Raise CantUnpackError if the target is not packed.
 * @param {string} target - target to unpack
 * @param {UnpackOptions} options - options
 */
export async function unpack(target: string);
export async function unpack(target: string, options: UnpackOptions);
export default async function unpack(target: string, options?: UnpackOptions) {
    await open({ target: target }, async (reader) => {
        await reader.unpack({ output: options?.output });
    });
}
