import * as fs from 'fs';
import * as http from 'http';
import * as mime from 'mime-types';
import * as MoroboxAIGameSDK from 'moroboxai-game-sdk';
import * as net from 'net';
import * as StreamZip from 'node-stream-zip';
import * as model from './model';

const GAME_HEADER_NAME: string = 'header.json';

/**
 * Read an entry from a .zip file.
 *
 * ```js
 * data = readZipEntry(zip, 'foo.txt');
 * ```
 *
 * Will raise an exception if entry doesn't exist.
 * @param {StreamZip} zip - Zip file.
 * @param {string} entry - Zip entry.
 * @returns {Buffer} Entry data.
 */
function readZipEntry(zip: StreamZip, entry: string): Buffer {
    try {
        return zip.entryDataSync(entry);
    } catch(_) {
        throw new Error(`No ${entry}`);
    }
}

/**
 * Read an entry from a .zip file as JSON object.
 *
 * ```js
 * data = readZipEntryJSON(zip, 'foo.txt');
 * ```
 *
 * Will raise an exception if entry doesn't exist or is not
 * a valid JSON file.
 * @param {StreamZip} zip - Zip file.
 * @param {string} entry - Zip entry.
 * @returns {any} JSON object
 */
function readZipEntryJSON(zip: StreamZip, entry: string): any {
    return JSON.parse(readZipEntry(zip, entry).toString());
}

/**
 * Read a game .zip file into memory.
 *
 * ```js
 * game = readGameZip(zip, 'header.json');
 * ```
 *
 * Will raise an exception if header doesn't exist or is not
 * a valid JSON file.
 * @param {StreamZip} zip - Zip file.
 * @param {string} entry - Header entry.
 * @returns {model.GameZip} Game data.
 */
function readGameZip(zip: StreamZip, entry: string): model.GameZip {
    // try to read header, may raise exception
    const game: model.GameZip = {
        file: undefined,
        header: readZipEntryJSON(zip, entry),
        icon: undefined,
        preview: undefined
    };

    // try to get icon
    if (game.header.icon) {
        try {
            game.icon = readZipEntry(zip, game.header.icon);
        } catch(_) {
            console.warn(`Icon ${game.header.icon} not found for ${game.header.title}`);
        }
    }

    // try to get preview
    if (game.header.preview) {
        try {
            game.preview = readZipEntry(zip, game.header.preview);
        } catch(_) {
            console.warn(`Preview ${game.header.preview} not found for ${game.header.title}`);
        }
    }

    return game;
}

/**
 * Load a .zip file to memory.
 * @param {string} file - Path to file.
 * @param {function} callback - Called when done.
 */
function loadZip(file: string, callback: (err: any, zip: StreamZip) => void) {
    const zip = new StreamZip({
        file,
        storeEntries: true
    });

    zip.on('ready', () => {
        callback(undefined, zip);
    });

    zip.on('error', _ => {
        callback(_, undefined);
    });
}

/**
 * Load a game from .zip file.
 *
 * ```js
 * loadGameZip('/some/file.zip', (err, game) => {
 *     ...
 * });
 * ```
 *
 * Each game is bundled in a .zip with a header.json file
 * containing the game metadata. This function reads the
 * content of header.json as a JSON object.
 * @param {string} file - Path to .zip file.
 * @param {function} callback - Function called when done or error occured.
 */
function loadGameZip(file: string, callback: (err: any, game: model.GameZip) => void): void {
    loadZip(file, (err, zip) => {
        if (err) {
            callback(err, undefined);
            return;
        }

        try {
            // valid zip
            const game = readGameZip(zip, GAME_HEADER_NAME);
            game.file = file;
            zip.close();
            callback(undefined, game);
        } catch(e) {
            // invalid zip
            zip.close();
            callback(e, undefined);
        }
    });
}

/**
 * Load games from a list of .zip files.
 *
 * ```js
 * loadGameZips(['a.zip', 'b.zip'], (err, game) => {
 *     // called for each game
 *     ...
 * }, () => {
 *     // called when done
 *     ...
 * });
 * ```
 *
 * Each game is bundled in a .zip archive and contains a
 * header.json file describing the game.
 * @param {string[]} files - Games directory.
 * @param {function} callback - Function called for each file.
 * @param {function} done - Function called when done.
 */
function loadGameZips(files: string[], callback: (err: any | null, game: model.GameZip) => void, done: () => void): void {
    files.forEach(_ => {
        loadGameZip(_, (err, game) => {
            callback(err, game);
        });
    });

    done();
}

/**
 * List .zip files contained in a directory.
 *
 * ```js
 * listZipFiles('/some/dir', (err, files) => {
 *     if (err !== undefined) {
 *         console.error(err);
 *         return;
 *     }
 *
 *     console.log(files);
 * });
 * ```
 *
 * @param {string} root - Parent directory.
 * @param {function} callback - Function called on completion.
 */
function listZipFiles(root: string, callback: (err: any | null, files: string[]) => void): void {
    fs.readdir(root, (err, files) => {
        // couldn't access the directory
        if (err) {
            callback(err, undefined);
            return;
        }

        // list zip files
        callback(undefined, files.filter(file => file.endsWith('.zip')));
    });
}

interface ILocalFileServer extends MoroboxAIGameSDK.IFileServer {
    /**
     * Set the list of games whose static files are served by this server.
     * @param {model.GameZip[]} games - List of games.
     */
    setGames(games: model.GameZip[]): void;

    /**
     * Set the game whose static files are served by this server.
     * @param {StreamZip} game - Game.
     */
    setGame(game: model.GameZip, zip: StreamZip): void;
}

/**
 * Local file server.
 *
 * This server is used to serve static files from disk
 * to HTML, such as CSS or JS files, throught a local
 * HTTP socket.
 *
 * This is also used to serve the files bundled in games
 * archives.
 */
class LocalFileServer extends MoroboxAIGameSDK.FileServer implements ILocalFileServer {
    // list of games for serving static files
    private _games: any;
    // loaded game
    private _game: model.GameZip;
    private _gameZip: StreamZip;

    constructor() {
        super((req, res) => this._route(req.url, res));
    }

    public get port() : number {
        return this.address.port;
    }

    public setGames(games: model.GameZip[]): void {
        this._games = {};

        games.forEach(game => {
            this._games[game.header.id] = game;
        });
    }

    public setGame(game: model.GameZip, zip: StreamZip): void {
        this._game = game;
        this._gameZip = zip;
    }

    private _route(url: string, res: http.ServerResponse): void {
        let result = url.match(/^\/games\/(?<id>(\w+[-])+\w+)\/(?<file>.*)$/);
        if (result) {
            this._routeGames(result.groups.id, result.groups.file, res);
            return;
        }

        result = url.match(/^\/game\/(?<file>.*)$/);
        if (result) {
            this._routeGame(result.groups.file, res);
            return;
        }

        this._routeAssets(url, res);
    }

    /**
     * Route for serving static files from /assets directory.
     * @param {string} url - Base url.
     * @param {http.ServerResponse} res - Response.
     */
    private _routeAssets(url: string, res: http.ServerResponse): void {
        fs.readFile(`./${url}`, (err, data) => {
            res.setHeader('Content-Type', mime.lookup(url));
            if (err) {
                res.statusCode = 404;
                res.end('404: File Not Found');
            } else if (url.endsWith('.css')) {
                res.end(data);
            } else if (url.endsWith('.TTF')) {
                res.end(data);
            }
        });
    }

    /**
     * Route for serving static files from games .zip files.
     * @param {string} id - Game id.
     * @param {string} file - Requested static file.
     * @param {http.ServerResponse} res - Response.
     */
    private _routeGames(id: string, file: string, res: http.ServerResponse): void {
        const game: model.GameZip = this._games[id];
        if (game === undefined) {
            res.writeHead(404);
            return;
        }

        if (file === 'icon') {
            res.setHeader('Content-Type', mime.lookup(game.header.icon));
            res.end(game.icon);
        } else if (file === 'preview') {
            res.setHeader('Content-Type', mime.lookup(game.header.preview));
            res.end(game.preview);
        }
    }

    /**
     * Route for serving static files from loaded game .zip file.
     * @param {string} file - Requested static file.
     * @param {http.ServerResponse} res - Response.
     */
    private _routeGame(file: string, res: http.ServerResponse): void {
        console.log(file);
        res.setHeader('Content-Type', mime.lookup(file));
        if (this._game === undefined) {
            console.error('no game');
            res.writeHead(404);
            res.end(undefined);
            return;
        }

        if (file === 'index.html') {
            const bootHref = this.href(`game/${this._game.header.boot}`);

            res.end('<html>' +
                `<body data-fileserver-url="${this.href('')}">` +
                '</body>' +
                `<script type="text/javascript" src="${bootHref}"></script>` +
            '</html>');
            return;
        }

        try {
            res.end(readZipEntry(this._gameZip, file));
        } catch(_) {
            console.error(_);
            res.writeHead(404);
            res.end(undefined);
        }
    }
}

/**
 * Fake file server used for games.
 *
 * This wraps the local file server used by MoroboxAI but
 * only allows requests to http://host:port/game/path URLs.
 */
class GameFileServer implements MoroboxAIGameSDK.IFileServer
{
    private _gameInstance: model.IGameInstance;

    constructor(gameInstance: model.IGameInstance) {
        this._gameInstance = gameInstance;
    }

    public get address(): net.AddressInfo {
        return {
            address: '127.0.0.1',
            family: '',
            port: 0
        };
    }

    public href(url: string): string {
        return this._gameInstance.gameHref(url);
    }

    ready(callback: () => void): void {
        callback();
    }

    close(callback?: (err: any) => void): void {
        callback(new Error('invalid method'));
    }
}

/**
 * Embedded version of the SDK.
 *
 * This is meant to be run inside of MoroboxAI.
 */
class EmbeddedGameSDK extends MoroboxAIGameSDK.GameSDKBase {
    private _gameInstance: model.IGameInstance;

    constructor(gameInstance: model.IGameInstance) {
        const aiServer = new MoroboxAIGameSDK.AIServer();
        aiServer.listen();
        super({
            aiServer,
            fileServer: new GameFileServer(gameInstance)
        });
        this._gameInstance = gameInstance;
    }
}

export { loadGameZip, loadGameZips, loadZip, listZipFiles, ILocalFileServer, LocalFileServer, EmbeddedGameSDK };
