import * as yargs from "yargs";
import removeGame from "../utils/removeGame";

export interface Options {
    // Id of the game
    game: string;
}

export default async function (args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await removeGame({ game: args.game });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
