import * as yargs from "yargs";
import { printList } from "../utils/list";
import { GAMES_DIR } from "../utils/platform";

interface Options {}

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    try {
        printList({ rootDir: GAMES_DIR });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command("games", "List installed games", {}, handle);
}
