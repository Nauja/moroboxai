console.log('MoroboxAI is starting...');
import { app as ElectronApp, BrowserWindow } from 'electron';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const WINDOW_WIDTH: number = 480;
const WINDOW_HEIGHT: number = 480;

// parse command line arguments
const argv = yargs(hideBin(process.argv)).command(
    'moroboxai', 'Run MoroboxAI'
).option<string, yargs.Options>(
    'games-dir', {
        description: 'Directory containing MoroboxAI games',
        type: 'string',
        default: './games'
}).option<string, yargs.Options>(
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
}).help()
.alias('help', 'h')
.argv;

// create and display main window, pass arguments
let mainWindow: Electron.BrowserWindow;

ElectronApp.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: argv.width as number,
        height: argv.height as number,
        resizable: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadFile(`${__dirname}/app/index.html`, {query: {options: JSON.stringify({
        gamesDir: argv.gamesDir,
        host: argv.host,
        port: argv.port
    })}});
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

ElectronApp.on('window-all-closed', () => {
    ElectronApp.quit();
});
