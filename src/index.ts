console.log('MoroboxAI is starting...');
import { app as ElectronApp, BrowserWindow } from 'electron';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const WINDOW_WIDTH: number = 640;
const WINDOW_HEIGHT: number = 360;
const GAMES_DIR: string = './games';
const MAIN_CSS: string = 'assets/theme.css';
const BOOT_MIN_DURATION: number = 4000;

// parse command line arguments
const argv = yargs(hideBin(process.argv)).command(
    'moroboxai', 'Run MoroboxAI'
).option<string, yargs.Options>(
    'host', {
        description: 'Public TCP host used for AIs',
        type: 'string',
        default: '127.0.0.1'
}).option<string, yargs.Options>(
    'port', {
        description: 'Public TCP port used for AIs',
        type: 'number',
        default: 0
}).option<string, yargs.Options>(
    'width', {
        description: 'Force window width',
        type: 'number',
        default: WINDOW_WIDTH
}).option<string, yargs.Options>(
    'height', {
        description: 'Force window height',
        type: 'number',
        default: WINDOW_HEIGHT
}).option<string, yargs.Options>(
    'games-dir', {
        description: 'Directory containing MoroboxAI games',
        type: 'string',
        default: GAMES_DIR
}).option<string, yargs.Options>(
    'main-css', {
        description: 'Path to custom theme.css file',
        type: 'string',
        default: MAIN_CSS
}).option<string, yargs.Options>(
    'boot-duration', {
        description: 'Forced minimum boot duration',
        type: 'number',
        default: BOOT_MIN_DURATION
}).help()
.alias('help', 'h')
.argv;

// create and display main window, pass arguments
let mainWindow: Electron.BrowserWindow;

ElectronApp.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: argv.width as number,
        height: argv.height as number,
        useContentSize: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadFile(`${__dirname}/app/index.html`, {query: {options: JSON.stringify({
        nativeWidth: WINDOW_WIDTH,
        nativeHeight: WINDOW_HEIGHT,
        host: argv.host,
        port: argv.port,
        gamesDir: argv.gamesDir,
        mainCss: argv.mainCss,
        bootDuration: argv.bootDuration
    })}});
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

ElectronApp.on('window-all-closed', () => {
    ElectronApp.quit();
});
