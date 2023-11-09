import * as yargs from "yargs";
import { app as ElectronApp, BrowserWindow } from "electron";
import { GameNotFoundError, BootNotFoundError } from "../utils/errors";
import pullGame from "../utils/pullGame";
import openGame from "../utils/openGame";
import * as constants from "../constants";
import pullBoot from "../utils/pullBoot";

interface SetupGameOptions {
    // Id of the game
    game: string;
}

async function setupGame(options: SetupGameOptions) {
    try {
        await pullGame({ game: options.game });
    } catch (err) {
        if (err instanceof GameNotFoundError) {
            throw "Game not found";
        }

        throw err;
    }
}

export interface Options {
    // Id or URL of the game
    game: string;
}

export default async function (args: yargs.ArgumentsCamelCase<Options>) {
    try {
        await setupGame({ game: args.game });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

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
