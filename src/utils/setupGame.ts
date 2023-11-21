import pull from "./pull";
import open, { Header, IReader } from "./open";
import { NotFoundError, NotGameError } from "./errors";
import { GameHeader } from "moroboxai-game-sdk";
import type { SourcesOptions } from "./pull/types";

type GetOrInstallOptions = Partial<SourcesOptions> & {
    // Id or path of the target
    target: string;
};

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
        return await open({ target: options.target }, async (reader) => {
            try {
                await callback(reader);
            } catch (err) {
                // Translate to a generic error
                throw new Error(err);
            }
        });
    } catch (err) {
        // Will try to install in case of not found error
        if (!(err instanceof NotFoundError)) {
            throw err;
        }
    }

    // Try to install it
    await pull(options.target, {
        sources: options.sources,
        extraSources: options.extraSources,
    });

    // Retry to open it
    await open({ target: options.target }, callback);
}

/**
 * Options for setupGame.
 */
export type SetupGameOptions = Partial<SourcesOptions> & {
    // Id or URL of the game
    game: string;
    // Force downloading even if the game exists
    force?: boolean;
};

/**
 * Setup a game.
 *
 * Raise NotFoundError if the game or boot is not found.
 * Raise HeaderNotFoundError if the header is not found.
 * @param {SetupGameOptions} options - options
 */
export default async function setupGame(options: SetupGameOptions) {
    // Install the game
    return await getOrInstall(
        {
            target: options.game,
            sources: options.sources,
            extraSources: options.extraSources,
        },
        async (game) => {
            // Load the header
            const header: Header = await game.loadHeader();
            if (header.type !== "game") {
                // This is not a game
                throw new NotGameError(game.id);
            }

            // Boot can be a function
            const gameHeader = header as GameHeader;
            if (typeof gameHeader.boot !== "string") {
                return;
            }

            // Install the boot
            await getOrInstall(
                {
                    target: gameHeader.boot,
                    sources: options.sources,
                    extraSources: options.extraSources,
                },
                async (boot) => {}
            );
        }
    );
}
