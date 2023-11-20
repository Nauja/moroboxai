import * as yargs from "yargs";
import * as path from "path";
import { app as ElectronApp, BrowserWindow } from "electron";
import * as constants from "../constants";
import setupGame from "../utils/setupGame";
import type { SourcesOptions } from "../utils/pull/types";

function runElectron(args: yargs.ArgumentsCamelCase<Options>) {
    // create and display main window, pass arguments
    let mainWindow: Electron.BrowserWindow;

    ElectronApp.on("ready", () => {
        mainWindow = new BrowserWindow({
            width: args.width as number,
            height: args.height as number,
            useContentSize: true,
            resizable: true,
            webPreferences: {
                nodeIntegration: true,
            },
        });
        mainWindow.loadFile(`${__dirname}/../app/index.html`, {
            query: {
                options: JSON.stringify({
                    nativeWidth: constants.WINDOW_WIDTH,
                    nativeHeight: constants.WINDOW_HEIGHT,
                    host: args.host,
                    port: args.port,
                    cpuDir: args.cpuDir,
                    gamesDir: args.gamesDir,
                    game: args.game,
                    mainCss: args.mainCss,
                    bootDuration: args.bootDuration,
                }),
            },
        });
        mainWindow.on("closed", () => {
            mainWindow = null;
        });
    });

    ElectronApp.on("window-all-closed", () => {
        ElectronApp.quit();
    });
}

export type Options = Partial<SourcesOptions> & {
    // Id or URL of the game
    game: string;
    // Exit just before running the game
    exit?: boolean;
};

async function handle(args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await setupGame({
            game: args.game,
            sources: args.sources,
            extraSources: args.extraSources,
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    if (args.exit === true) {
        return;
    }

    runElectron(args);
}

export default function (argv: yargs.Argv<{}>): yargs.Argv<{}> {
    return argv.command(
        "run game",
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
                })
                .option<string, yargs.Options>("sources", {
                    description: "Override default sources",
                    type: "array",
                })
                .option<string, yargs.Options>("extra-sources", {
                    description: "Additional sources",
                    type: "array",
                })
                .option<string, yargs.Options>("exit", {
                    alias: "e",
                    description: "Exit just before running the game",
                    type: "boolean",
                    default: false,
                });
        },
        handle
    );
}
