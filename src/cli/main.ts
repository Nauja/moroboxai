/**
 * Entrypoint of Electron and the CLI.
 */
import * as yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as constants from "../constants";
import { createDirs } from "../utils/platform";
import games from "./games";
import boots from "./boots";
import agents from "./agents";
import pull from "./pull";
import rm from "./rm";
import run from "./run";
import info from "./info";
import pack from "./pack";
import unpack from "./unpack";

export default function (arg?: string | readonly string[]) {
    process.on("uncaughtException", (error) => {
        console.debug(error);
    });

    createDirs();

    if (arg === undefined) {
        arg = yargs.argv["_"];
    }

    // Create the parser
    const main = yargs(hideBin(process.argv));

    run(main);
    pull(main);
    games(main);
    boots(main);
    agents(main);
    pack(main);
    unpack(main);
    rm(main);
    info(main);

    // Parse command line arguments
    main.strictCommands()
        .demandCommand()
        .help()
        .alias("help", "h")
        .parseAsync(arg);
}
