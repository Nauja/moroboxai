//import * as TowerDefense from '@moroboxai-games/towerdefense';
//import * as MoroboxAIGameSDK from 'moroboxai-game-sdk';
import * as staticZip from 'express-static-zip';
import * as http from 'http';
import * as net from 'net';
import * as path from 'path';
import * as PIXI from 'pixi.js';
import * as querystring from 'querystring';
import * as monad from './monad';

const filesServer: http.Server = http.createServer(staticZip('./games/pong.zip')).listen(0, '127.0.0.1', () => {
    const address: net.AddressInfo = filesServer.address() as net.AddressInfo;
    console.log(`Files server listening on ${address.address}:${address.port}`);
});

// get back command line arguments from URL query
const query: querystring.ParsedUrlQuery = querystring.parse(global.location.search);
const options: any = JSON.parse(query['?options'] as string);

/**
 * Load all valid games from a directory.
 *
 * ```js
 * loadGames('/some/dir', games => {
 *     console.log(games);
 * });
 * ```
 *
 * Each game is bundled in a .zip file containing a header.json
 * file describing the game.
 * @param {string} root - Games directory.
 * @param {function} callback - Called on completion.
 */
function loadGames(root: string, callback: (games: Array<any>) => void) {
    const games: Array<any> = Array<any>();

    console.log(`Loading games from "${root}" directory...`);
    // list .zip files contained in directory
    monad.listZipFiles(root, (err, files) => {
        // an IO error occured
        if (err !== undefined) {
            console.error(`Failed to load games: ${err}`);
            callback(games);
            return;
        }

        // load headers from .zip files
        monad.readGamesHeaders(
            files.map(_ => path.join(root, _)),
            (errFile, file, header) => {
                // incorrect game, discard
                if (errFile !== undefined) {
                    console.error(`Failed to load game ${file}: ${errFile}`);
                    return;
                }

                // correct game, keep it
                console.log(`Loaded game ${header.title} from ${file}`);
                games.push({
                    file,
                    header
                });
            },
            () => {
                // done
                callback(games);
            }
        );
    });
}

const gamesDir: string = options.gamesDir;
let gamess: any[];
Promise.all([
    new Promise((resolve, reject) => {
        loadGames(gamesDir, games => {
            gamess = games;
            console.log(`Loaded ${games.length} game(s)`);
            resolve();
        });
    }),
    new Promise((resolve, reject) => {
        setTimeout(resolve, 1000);
    })
]).then(() => {
    const oldPanel = document.getElementById('startup_screen');
    const newPanel = document.createElement('div');
    newPanel.id = 'home_screen';
    newPanel.className = 'screen';
    document.body.replaceChild(newPanel, oldPanel);
    gamess.forEach(game => {
        const label = document.createElement('span');
        label.textContent = game.header.title;
        newPanel.appendChild(label);
    });
});

function on_server_started() {
    console.log(`cwd ${process.cwd()}`);
    //console.log(`Using moroboxai-game-sdk v${MoroboxAIGameSDK.VERSION}`);

    const loader = new PIXI.Loader();
    loader.add('8bitwonder', 'assets/8bitwonder.tft');
    loader.load((_, resources) => {
        console.log('loaded');
    });

    /*const gameInstance = new TowerDefense.Game();

    gameInstance.frame = (game: MoroboxAIGameSDK.AbstractGame) => {
        const size = game.output('screen_size');
        const pos = game.output('pos');
        const dir = game.output('dir');
        if (dir.x >= 0) {
            if (pos.x < size.x / 2.0 + 50) {
                game.input('horizontal', 1.0);
            } else {
                game.input('horizontal', -1.0);
            }
        } else {
            if (pos.x > size.x / 2.0 - 50) {
                game.input('horizontal', -1.0);
            } else {
                game.input('horizontal', 1.0);
            }
        }
    };
    */
}

// start TCP server for AI connections
const server: net.Server = net.createServer(
    socket => {
        console.log('connection');
    }
);

server.listen(options.port, options.host, () => {
    const address: net.AddressInfo = server.address() as net.AddressInfo;
    console.log(`MoroboxAI is listening on ${address.address}:${address.port}`);
    on_server_started();
});
