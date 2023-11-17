import open from "./open";

/**
 * Options for pack.
 */
export interface PackOptions {
    // Path of the target
    path: string;
    // Destination archive
    output?: string;
}

/**
 * Pack a game, boot, or angent, to archive.
 *
 * Raise ErrnoException if the src is not found.
 * Raise NotFoundError if the target is not found.
 * Raise HeaderNotFoundError if the header is not found.
 * @param {PullBootOptions} options - options
 */
export default async function pack(options: PackOptions) {
    await open({ target: options.path }, async (reader) => {
        await reader.pack({ output: options.output });
    });
}
