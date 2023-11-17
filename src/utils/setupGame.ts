import pull from "./pull";
import open, { Header, IReader } from "./open";
import { GameNotFoundError, NotFoundError, NotGameError } from "./errors";
import { GameHeader } from "moroboxai-game-sdk";

interface GetOrInstallOptions {
    // Id or path of the target
    target: string;
}

/**
 * Make sure an element is installed.
 * @param options
 */
async function getOrInstall(
    options: GetOrInstallOptions,
    callback: (reader: IReader) => Promise<void>
) {
    try {
        // Try to open it
        await open({ target: options.target }, callback);
    } catch (err) {
        // Will try to install in case of not found error
        if (!(err instanceof NotFoundError)) {
            throw err;
        }
    }

    // Try to install it
    await pull({ target: options.target });

    // Retry to open it
    await open({ target: options.target }, callback);
}

/**
 * Options for setupGame.
 */
export interface SetupGameOptions {
    // Id or URL of the game
    game: string;
    // Force downloading even if the game exists
    force?: boolean;
}

/**
 * Setup a game.
 *
 * Raise NotFoundError if the game or boot is not found.
 * Raise HeaderNotFoundError if the header is not found.
 * @param {SetupGameOptions} options - options
 */
export default async function setupGame(options: SetupGameOptions) {
    return new Promise<void>(async (resolve) => {
        // Install the game
        await getOrInstall({ target: options.game }, async (game) => {
            // Load the header
            let header: Header | GameHeader = await game.loadHeader();
            if (header.type !== "game") {
                // This is not a game
                throw new NotGameError(game.id);
            }

            // Boot can be a function
            header = header as GameHeader;
            if (typeof header.boot !== "string") {
                return resolve();
            }

            // Install the boot
            await getOrInstall({ target: header.boot }, async (boot) => {
                return resolve();
            });
        });
    });
}
