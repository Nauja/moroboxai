import * as fs from "fs";
import * as http from "http";
import * as mime from "mime-types";
import * as MoroboxAIGameSDK from "moroboxai-game-sdk";
import * as net from "net";
import { ICPULoader } from "./cpu";
import { IGameLoader } from "./game";

/**
 * Fetch data from an URL.
 * @param {string} url - Remote URL
 * @returns {Promise} Data when ready
 */
function getUrl(url: string): Promise<string> {
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                return Promise.reject(response.status);
            }

            return response.blob();
        })
        .then((blob) => blob.text());
}

export interface ILocalFileServer extends MoroboxAIGameSDK.IFileServer {
    setCPUs(cpus: ICPULoader[]): void;

    /**
     * Set the list of games whose static files are served by this server.
     * @param {IGameLoader[]} games - List of games.
     */
    setGames(games: IGameLoader[]): void;

    /**
     * Set the game whose static files are served by this server.
     * @param {string} id - Unique game id.
     */
    setGame(id?: string): void;
}

/**
 * Simply a wrapper over net.Server for controlling the server.
 *
 * Because there are common tasks such as listening to a port,
 * being notified when ready, closing the server...
 */
class ServerWrapper implements MoroboxAIGameSDK.IServer {
    // server instance
    private _server: net.Server;
    // callback called when server is ready
    private _readyCallback?: () => void;
    // if the server is ready
    private _isReady: boolean = false;

    /**
     * Get the server instance.
     * @returns {net.Server} Server
     */
    protected get server(): net.Server {
        return this._server;
    }

    /**
     * Get the public address of the server.
     * @returns {net.AddressInfo} Address
     */
    public get address(): net.AddressInfo {
        return this._server.address() as net.AddressInfo;
    }

    /**
     * Get the public port of the server.
     * @returns {number} Port
     */
    public get port(): number {
        return this.address.port;
    }

    constructor(server: net.Server) {
        this._server = server;
    }

    /**
     * Start server on a local port.
     * @param {number} port - Port
     */
    public listen(port: number = 0): void {
        this._server.listen(port, "127.0.0.1", () => {
            this._notifyReady();
        });
    }

    public ready(callback: () => void): void {
        this._readyCallback = callback;
        if (this._isReady) {
            callback();
        }
    }

    private _notifyReady(): void {
        this._isReady = true;
        if (this._readyCallback !== undefined) {
            this._readyCallback();
        }
    }

    public close(callback?: (err: any) => void): void {
        this._server.close((e) => {
            this._isReady = false;

            if (callback !== undefined) {
                callback(e);
            }
        });
    }
}

/**
 * Implementation of the local file server.
 */
export class FileServer
    extends ServerWrapper
    implements MoroboxAIGameSDK.IFileServer
{
    /**
     * Default route for serving local files.
     * @param {http.IncomingMessage} req - Request
     * @param {http.ServerResponse} res - Response
     */
    public static serveLocalFiles(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): void {
        // invalid URL
        if (req.url === undefined) {
            res.writeHead(404);
            res.end();
            return;
        }

        // check if requested path is a file
        const path = `./${req.url}`;
        fs.stat(path, (e, stats) => {
            if (e || !stats.isFile()) {
                console.error(e);
                res.writeHead(404);
                res.end();
                return;
            }

            // read and return file content
            res.end(fs.readFileSync(path));
        });
    }

    /**
     * Create a local file server.
     * @param {Function} requestListener - Custom route for serving files
     */
    constructor(requestListener?: http.RequestListener | undefined) {
        super(
            http.createServer(
                requestListener !== undefined
                    ? requestListener
                    : FileServer.serveLocalFiles
            )
        );
    }

    get url(): string {
        return "";
    }

    get baseUrl(): string {
        return "";
    }

    public href(path: string): string {
        return `http://${this.address.address}:${this.address.port}/${path}`;
    }

    public get(path: string): Promise<string> {
        return getUrl(path);
    }
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
export class LocalFileServer extends FileServer implements ILocalFileServer {
    // list of cpus for serving static files
    private _cpusById: { [key: string]: ICPULoader };
    // list of games for serving static files
    private _gamesById: { [key: string]: IGameLoader };
    // loaded game
    private _game?: IGameLoader;

    constructor() {
        super((req, res) => this._route(req.url, res));
    }

    get url(): string {
        return "";
    }

    get baseUrl(): string {
        return "";
    }

    get port(): number {
        return this.address.port;
    }

    setCPUs(cpus: ICPULoader[]): void {
        this._cpusById = {};

        cpus.forEach((_) => {
            this._cpusById[_.file] = _;
        });
    }

    setGames(games: IGameLoader[]): void {
        this._gamesById = {};

        games.forEach((_) => {
            this._gamesById[_.header.id] = _;
        });
    }

    setGame(id: string): void {
        if (!(id in this._gamesById)) {
            this._game = undefined;
        } else {
            this._game = this._gamesById[id];
        }
    }

    cpuHref(cpu: ICPULoader): string {
        return `cpu/${cpu.file}`;
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

        result = url.match(/^\/cpu\/(?<file>.*)$/);
        if (result) {
            this._routeCPU(result.groups.file, res);
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
            res.setHeader("Content-Type", mime.lookup(url));
            if (err) {
                res.statusCode = 404;
                res.end("404: File Not Found");
            } else if (url.endsWith(".css")) {
                res.end(data);
            } else if (url.endsWith(".TTF")) {
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
    private _routeGames(
        id: string,
        file: string,
        res: http.ServerResponse
    ): void {
        const game: IGameLoader = this._gamesById[id];
        if (game === undefined) {
            res.writeHead(404);
            return;
        }

        if (file === "icon") {
            game.loadIcon().then((data) => {
                res.setHeader("Content-Type", mime.lookup(data));
                res.end(data);
            });
        } else if (file === "preview") {
            game.loadPreview().then((data) => {
                res.setHeader("Content-Type", mime.lookup(data));
                res.end(data);
            });
        }
    }

    /**
     * Route for serving static files from loaded game .zip file.
     * @param {string} file - Requested static file.
     * @param {http.ServerResponse} res - Response.
     */
    private _routeGame(file: string, res: http.ServerResponse): void {
        console.log(file);
        res.setHeader("Content-Type", mime.lookup(file));
        if (this._game === undefined) {
            console.error("no game");
            res.writeHead(404);
            res.end(undefined);
            return;
        }

        if (file === "index.html") {
            const bootHref = this.href(`game/${this._game.header.boot}`);

            res.end(
                "<html>" +
                    `<body data-fileserver-url="${this.href("")}">` +
                    "</body>" +
                    `<script type="text/javascript" src="${bootHref}"></script>` +
                    "</html>"
            );
            return;
        }

        this._game.loadFile(file).then((data) => {
            try {
                res.end(data);
            } catch (_) {
                console.error(_);
                res.writeHead(404);
                res.end(undefined);
            }
        });
    }

    /**
     * Route for serving static files from loaded game .zip file.
     * @param {string} file - Requested static file.
     * @param {http.ServerResponse} res - Response.
     */
    private _routeCPU(file: string, res: http.ServerResponse): void {
        const cpu = this._cpusById[file];
        if (cpu === undefined) {
            res.statusCode = 404;
            res.end("404: File Not Found");
            return;
        }

        res.setHeader("Content-Type", mime.lookup(file));
        cpu.load()
            .then((data) => {
                res.end(data);
            })
            .catch(() => {
                res.statusCode = 404;
                res.end("404: File Not Found");
            });
    }
}
