import * as engine from './engine';
import { GameInstance } from './engine';
import { ProgramOptions } from './model';
import { IGameLoader } from './monad/game';
import { ILocalFileServer } from './monad/server';

document.addEventListener('DOMContentLoaded', event => {
    const path = require('path');
    const querystring = require('querystring');
    const model = require('./model');
    const monadgame = require('./monad/game');
    const monadserver = require('./monad/server');

    // get back command line arguments from URL query
    const query = querystring.parse(global.location.search);
    const options: ProgramOptions = JSON.parse(query['?options'] as string);

    /**
     * Handle resizing the window.
     * @param {UIEvent} [evt] - Resize event.
     */
    function resize(evt?: UIEvent) {
        const widthRatio = document.body.clientWidth / options.nativeWidth;
        const heightRatio = document.body.clientHeight / options.nativeHeight;
        document.body.style.fontSize = `${widthRatio}em`;
    }

    // first resize for initial window size
    window.addEventListener('resize', resize);
    resize();

    function injectAssets(fileServer: ILocalFileServer, callback: () => void) : void {
        Promise.all([
            new Promise((resolve, reject) => {
                // inject main CSS dynamically in head
                const item = document.createElement('link');
                item.rel = 'stylesheet';
                item.type = 'text/css';
                item.href = fileServer.href(options.mainCss);
                item.onload = () => {
                    // everything fine
                    console.log(`Loaded ${options.mainCss}`);
                    callback();
                };
                item.onerror = (evt, source, lineno, colno, error) => {
                    // some error
                    console.error(`Error loading ${options.mainCss}: ${error}`);
                    callback();
                };
                document.head.appendChild(item);
            }),
            new Promise((resolve, reject) => {
                // inject font dynamically in head
                const item = document.createElement('style');
                item.innerText = '@font-face {' +
                    'font-family: "8bit";' +
                    `src: url("${fileServer.href('assets/8bitwonder.TTF')}") format("truetype");` +
                    '}';
                item.onload = () => {
                    // everything fine
                    console.log(`Loaded font 8bit`);
                    callback();
                };
                item.onerror = (evt, source, lineno, colno, error) => {
                    // some error
                    console.error(`Error loading font 8bit: ${error}`);
                    callback();
                };
                document.head.appendChild(item);
            })
        ]).then(callback);
    }

    /**
     * Boot process.
     *
     * It performs some tasks before displaying menus:
     * * Start the LocalFileServer.
     * * Load the main CSS file before displaying menus.
     * * Read games headers from game directory.
     * @param {function} callback - Function called when done.
     */
    function boot(callback: (fileServer: ILocalFileServer, games: IGameLoader[]) => void): void {
        const fileServer = new monadserver.LocalFileServer();
        const games = new Array<IGameLoader>();

        Promise.all([
            new Promise<void>((resolve, _) => {
                // task for initializing the local file server
                fileServer.ready(() => {
                    console.log(`LocalFileServer started on port ${fileServer.port}`);
                    // load external assets
                    injectAssets(fileServer, resolve);
                });
                fileServer.listen();
            }),
            new Promise<void>((resolve, _) => {
                // task for listing all the games
                monadgame.listGames(options.gamesDir, (game: IGameLoader) => {
                    games.push(game);
                }).then(() => {
                    console.log(`Found ${games.length} game(s)`);
                    resolve();
                });
            }),
            new Promise<void>((resolve, _) => {
                // force waiting a little
                setTimeout(resolve, options.bootDuration);
            })
        ]).then(() => {
            callback(fileServer, games);
        }).catch((e) => {
            console.error(e);
            console.error('Boot failed, see errors above');
        });
    }

    // start boot process
    boot((fileServer, games) => {
        console.log('Boot done');
        // really start moroboxai
        const gameInstance: GameInstance = new engine.GameInstance();
        gameInstance.init(fileServer, games, options, () => {
            // ready, destroy boot screen
            document.getElementById('mai_boot_screen').remove();
        });
    });
});
