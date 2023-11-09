import * as yargs from "yargs";
import pullGame, { EPullResult } from "../utils/pullGame";

export interface Options {
    // Id or URL of the game
    game: string;
    // Pull even if the game is already installed
    force?: boolean;
    // Destination of the archive
    output?: string;
    // Unpack the archive
    unpack?: boolean;
}

export default async function (args: yargs.ArgumentsCamelCase<Options>) {
    console.log(`Pulling game ${args.game}...`);

    try {
        const result = await pullGame({
            game: args.game,
            force: args.force,
            output: args.output,
            unpack: args.unpack,
        });
        if (result === EPullResult.Downloaded) {
            console.log("Game installed");
        } else if (result === EPullResult.AlreadyDownloaded) {
            console.log("Game already installed");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
