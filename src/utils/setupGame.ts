import pullGame from "./pullGame";
import openGame from "./openGame";

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
 * Raise GameNotFoundError if the game is not found.
 * Raise GameHeaderNotFoundError if the header is not found.
 * @param {SetupGameOptions} options - options
 */
export default async function setupGame(options: SetupGameOptions) {
    await pullGame({ game: options.game });
    const game = await openGame({ game: options.game });
    const header = await game.loadHeader();
}
