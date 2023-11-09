import openGame from "./openGame";
import { CWD } from "./platform";

/**
 * Options for unpackGame.
 */
export interface UnpackGameOptions {
    // Id or path of the game
    game: string;
    // Destination directory
    output?: string;
}

/**
 * Download a boot from any known source.
 *
 * Raise GameNotFoundError if the game is not found.
 * Raise CantUnpackError if the game is not packed.
 * @param {PullBootOptions} options - options
 */
export default async function unpackGame(options: UnpackGameOptions) {
    const game = await openGame({ game: options.game });
    try {
        await game.unpack(options.output ?? CWD);
    } finally {
        try {
            await game.close();
        } catch (err) {}
    }
}
