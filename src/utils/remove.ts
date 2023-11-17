import isID from "./isID";
import { UnexpectedArgumentError } from "./errors";
import open from "./open";

export interface RemoveOptions {
    // Id of the target
    target: string;
}

/**
 * Remove an installed game, boot, or agent.
 *
 * Raise UnexpectedArgumentError if the game is not an id.
 * Raise ErrnoException only if the error is not ENOENT.
 * @param {RemoveOptions} options - options
 */
export default async function remove(options: RemoveOptions) {
    if (!isID(options.target)) {
        throw new UnexpectedArgumentError("target", "should be an id");
    }

    await open({ target: options.target }, async (reader) => {
        await reader.remove();
    });
}
