import * as fs from 'fs';
import * as http from 'http';
import * as mime from 'mime-types';
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
        icon: undefined
    };

    // try to get icon
    if (game.header.icon) {
        try {
            game.icon = readZipEntry(zip, game.header.icon);
            console.log(`Found icon ${game.header.icon} for ${game.header.title}`);
        } catch(e) {
            console.warn(`Icon ${game.header.icon} not found for ${game.header.title}: ${e}`);
        }
    }

    return game;
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
    // open zip file
    const zip = new StreamZip({
        file,
        storeEntries: true
    });

    zip.on('ready', () => {
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

    // couldn't read zip file
    zip.on('error', _ => {
        callback(_, undefined);
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

interface ILocalFileServer {
    /**
     * Port we are listening to.
     * @returns {number} Port number
     */
    readonly port : number;

    /**
     * Build the absolute URL to a file served by this server.
     *
     * ```js
     * console.log(server.href('index.html'))
     * // http://host:port/index.html
     * ```
     * @param {string} url - Relative URL.
     * @returns {string} Absolute URL.
     */
    href(url: string) : string;

    /**
     * Set the list of games whose static files are served by this server.
     * @param {model.GameZip[]} games - List of games.
     */
    setGames(games: model.GameZip[]): void;
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
class LocalFileServer implements ILocalFileServer {
    // http server
    private _server: http.Server;
    // list of games for serving static files
    private _games: any;

    constructor() {
        this._server = http.createServer(
            (req, res) => this._route(req.url, res)
        );
    }

    public get port() : number {
        return (this._server.address() as net.AddressInfo).port;
    }

    /**
     * Start server on a random local port.
     * @param {function} callback - Called when server is started.
     */
    public listen(callback?: () => void) {
        return this._server.listen(0, '127.0.0.1', callback);
    }

    public href(url: string) : string {
        return `http://127.0.0.1:${this.port}/${url}`;
    }

    public setGames(games: model.GameZip[]): void {
        this._games = {};

        games.forEach(game => {
            this._games[game.header.id] = game;
        });
    }

    private _route(url: string, res: http.ServerResponse): void {
        console.log(`request ${url}`);
        const result = url.match(/^\/games\/(?<id>(\w+[-])+\w+)\/(?<file>.*)$/);
        if (result) {
            this._routeGames(result.groups.id, result.groups.file, res);
        } else {
            this._routeAssets(url, res);
        }
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
        if (file === 'icon') {
            const game: model.GameZip = this._games[id];
            if (game !== undefined) {
                res.setHeader('Content-Type', mime.lookup(game.header.icon));
                res.end(game.icon);
            } else {
                res.writeHead(404);
                res.setHeader('Content-Type', mime.lookup('.png'));
                res.end(undefined);
            }
        }
    }
}

export { loadGameZip, loadGameZips, listZipFiles, ILocalFileServer, LocalFileServer };
