/**
 * Entrypoint of Electron and the CLI.
 */
import * as yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as constants from "../constants";
import { createDirs } from "../utils/platform";
import handleGames from "./games";
import handleBoots from "./boots";
import handlePull from "./pull";
import handleRm from "./rm";
import handleRun from "./run";
import handleInfo from "./info";
import handlePack from "./pack";
import handleUnpack from "./unpack";

export default function (arg: string | readonly string[]) {
    process.on("uncaughtException", (error) => {
        console.debug(error);
    });

    createDirs();

    // parse command line arguments
    return yargs(hideBin(process.argv))
        .command("games", "List installed games", {}, handleGames)
        .command("boots", "List installed boots", {}, handleBoots)
        .command(
            "pull game",
            "Install a game",
            (yargs) => {
                return yargs
                    .positional<string, yargs.PositionalOptions>("game", {
                        description: "Id or URL of the game",
                        type: "string",
                    })
                    .option<string, yargs.Options>("f", {
                        alias: "force",
                        description:
                            "Pull even if the game is already installed",
                        type: "boolean",
                        default: false,
                    })
                    .option<string, yargs.Options>("o", {
                        alias: "output",
                        description: "Destination archive",
                        type: "string",
                    })
                    .option<string, yargs.Options>("u", {
                        alias: "unpack",
                        description: "Unpack the archive",
                        type: "boolean",
                        default: false,
                    });
            },
            handlePull
        )
        .command(
            "rm game",
            "Uninstall a game",
            {
                game: {
                    description: "Id of the game",
                    type: "string",
                },
            },
            handleRm
        )
        .command("rmb boot", "Uninstall a boot", {
            boot: {
                description: "Id or URL of the boot",
                type: "string",
            },
        })
        .command(
            "run [game]",
            "Run a game",
            (yargs) => {
                return yargs
                    .positional<string, yargs.PositionalOptions>("game", {
                        description: "Id or URL of the game",
                        type: "string",
                    })
                    .option<string, yargs.Options>("host", {
                        description: "Public TCP host used for AIs",
                        type: "string",
                        default: "127.0.0.1",
                    })
                    .option<string, yargs.Options>("port", {
                        description: "Public TCP port used for AIs",
                        type: "number",
                        default: 0,
                    })
                    .option<string, yargs.Options>("width", {
                        description: "Force window width",
                        type: "number",
                        default: constants.WINDOW_WIDTH,
                    })
                    .option<string, yargs.Options>("height", {
                        description: "Force window height",
                        type: "number",
                        default: constants.WINDOW_HEIGHT,
                    })
                    .option<string, yargs.Options>("cpu-dir", {
                        description: "Directory containing the CPUs",
                        type: "string",
                        default: constants.CPU_DIR,
                    })
                    .option<string, yargs.Options>("games-dir", {
                        description: "Directory containing MoroboxAI games",
                        type: "string",
                        default: constants.GAMES_DIR,
                    })
                    .option<string, yargs.Options>("main-css", {
                        description: "Path to custom theme.css file",
                        type: "string",
                        default: constants.MAIN_CSS,
                    })
                    .option<string, yargs.Options>("boot-duration", {
                        description: "Forced minimum boot duration",
                        type: "number",
                        default: constants.BOOT_MIN_DURATION,
                    });
            },
            handleRun
        )
        .command(
            "pack path",
            "Pack a game to archive",
            (yargs) => {
                return yargs
                    .positional<string, yargs.PositionalOptions>("path", {
                        description: "Path of the game",
                        type: "string",
                    })
                    .option<string, yargs.Options>("o", {
                        alias: "output",
                        description: "Destination archive",
                        type: "string",
                    });
            },
            handlePack
        )
        .command(
            "unpack path",
            "Unpack a game from archive",
            (yargs) => {
                return yargs
                    .positional<string, yargs.PositionalOptions>("path", {
                        description: "Id or path of the game",
                        type: "string",
                    })
                    .option<string, yargs.Options>("o", {
                        alias: "output",
                        description: "Destination directory",
                        type: "string",
                    });
            },
            handleUnpack
        )
        .command("info", "Display some information", {}, handleInfo)
        .strictCommands()
        .demandCommand()
        .help()
        .alias("help", "h")
        .parseAsync(arg);
}
