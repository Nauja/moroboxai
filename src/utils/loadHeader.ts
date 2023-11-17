import open, { Header } from "./open";

export interface LoadHeaderOptions {
    // Id or path of the target
    target: string;
}

/**
 * Load the header.
 *
 * Raise NotFoundError if the target is not found.
 * Raise HeaderNotFoundError if the target is not found.
 * @returns header
 */
export default async function loadHeader(
    options: LoadHeaderOptions
): Promise<Header> {
    return new Promise<Header>(async (resolve) => {
        await open({ target: options.target }, async (reader) => {
            await reader.loadHeader().then(resolve);
        });
    });
}
