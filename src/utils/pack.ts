import open from "./open";

/**
 * Options for pack.
 */
export interface PackOptions {
    // Output path
    output?: string;
}

/**
 * Pack a game, boot, or agent, to archive.
 *
 * Raise ErrnoException if the src is not found.
 * Raise NotFoundError if the target is not found.
 * Raise HeaderNotFoundError if the header is not found.
 * @param {string} target - target to pack
 * @param {PackOptions} options - options
 */
export async function pack(target: string);
export async function pack(target: string, options: PackOptions);
export default async function pack(target: string, options?: PackOptions) {
    await open({ target: target }, async (reader) => {
        await reader.pack({ output: options?.output });
    });
}
