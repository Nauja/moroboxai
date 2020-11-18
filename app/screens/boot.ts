import * as net from 'net';
import * as path from 'path';
import * as model from '../model';
import * as monad from '../monad';

export interface Options {
    // games directory
    gamesDir: string;
    // minimum time the boot screen is displayed.
    minDuration: number;
    // main CSS file
    mainCss: string;
}

/**
 * This is the boot screen.
 *
 * It performs some tasks before displaying menus:
 * * Start the LocalFileServer.
 * * Load the main CSS file before displaying menus.
 * * Read games headers from game directory.
 */
export class Screen {
    private _root: HTMLElement;
    private _options: Options;

    constructor(root: HTMLElement, options: Options) {
        this._root = root;
        this._options = options;
    }

    /**
     * Run the boot process.
     * @param {function} callback - Function called when done.
     */
    public run(callback: (fileServer: monad.ILocalFileServer, games: model.GameZip[]) => void): void {
        const fileServer = new monad.LocalFileServer();
        let loadedGames: model.GameZip[];
        Promise.all([
            new Promise((resolve, reject) => {
                // initialize local file server
                fileServer.listen(() => {
                    console.log(`LocalFileServer started on port ${fileServer.port}`);
                    // inject app.css dynamically in head
                    const item = document.createElement('link');
                    item.rel = 'stylesheet';
                    item.type = 'text/css';
                    item.href = fileServer.href(this._options.mainCss);
                    item.onload = () => {
                        // everything fine
                        console.log(`Loaded ${this._options.mainCss}`);
                        resolve();
                    };
                    item.onerror = (event, source, lineno, colno, error) => {
                        // some error
                        console.error(`Error loading ${this._options.mainCss}: ${error}`);
                        reject();
                    };
                    document.head.appendChild(item);
                });
            }),
            new Promise((resolve, _) => {
                // load games headers
                loadGames(this._options.gamesDir, games => {
                    loadedGames = games;
                    console.log(`Loaded ${games.length} game(s)`);
                    resolve();
                });
            }),
            new Promise((resolve, _) => {
                // force waiting a little
                setTimeout(resolve, this._options.minDuration);
            })
        ]).then(() => {
            callback(fileServer, loadedGames);
        }).catch(() => {
            console.error('Bootstrap failed, see error above');
        });
    }

    public remove(): void {
        this._root.remove();
    }
}

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
function loadGames(root: string, callback: (games: model.GameZip[]) => void) {
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
        monad.readGames(
            files.map(_ => path.join(root, _)),
            (errFile, game) => {
                // incorrect game, discard
                if (errFile !== undefined) {
                    console.error(`Failed to load game ${game.file}: ${errFile}`);
                    return;
                }

                // correct game, keep it
                console.log(`Loaded game ${game.header.title} from ${game.file}`);
                games.push(game);
            },
            () => {
                // done
                callback(games);
            }
        );
    });
}
