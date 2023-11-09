import { GameHeader } from "moroboxai-game-sdk";
import openGame from "./openGame";

export interface LoadGameHeaderOptions {
    // Id or path of the game
    game: string;
}

/**
 * Load the header of a game.
 *
 * Raise GameNotFoundError if the game is not found.
 * Raise GameHeaderNotFoundError if the header is not found.
 * @returns header
 */
export default async function loadGameHeader(
    options: LoadGameHeaderOptions
): Promise<GameHeader> {
    const reader = await openGame({ game: options.game });
    if (reader === undefined) {
        return Promise.resolve(undefined);
    }

    return reader.loadHeader();
}
