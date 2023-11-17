import * as yargs from "yargs";
import { GAMES_DIR } from "../utils/platform";

interface Options {}

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    console.log(`Games dir: ${GAMES_DIR}`);
    process.exit(0);
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command("info", "Display some information", {}, handle);
}
