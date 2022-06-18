import { GameHeader } from 'moroboxai-game-sdk';
import StreamZip = require('node-stream-zip');
import { ProgramOptions } from './model';
import { IGameLoader } from './monad/game';
import { ILocalFileServer } from './monad/server';
import * as screen from './screens';

export interface IGameInstance {
    /**
     * Loaded games.
     */
    readonly games: GameHeader[];

    /**
     * Load a game into memory.
     * @param {string} id - Unique game id
     * @returns {Promise} Called when done.
     */
    loadGame(id: string): Promise<void>;

    /**
     * Unload currently loaded game.
     * @returns {Promise} Called when done.
     */
    unloadGame(): Promise<void>;

    /**
     * Build the absolute URL to a local file.
     *
     * ```js
     * console.log(gameInstance.href('index.html'))
     * // http://host:port/index.html
     * ```
     * @param {string} url - Relative URL.
     * @returns {string} Absolute URL.
     */
    assetsHref(url: string): string;
    gamesHref(id: string, url: string): string;
    gameHref(url: string): string;
}

export class GameInstance implements IGameInstance {
    private _fileServer: ILocalFileServer;
    private _games: IGameLoader[];
    private _gamesById: {[key: string]: IGameLoader};
    private _game: StreamZip;
    private _options: ProgramOptions;
    private _homeScreen: screen.HomeScreen = new screen.HomeScreen();
    private _gameScreen: screen.GameScreen = new screen.GameScreen();

    public init(fileServer: ILocalFileServer, games: IGameLoader[], options: ProgramOptions, ready?: () => void) {
        this._fileServer = fileServer;
        this._games = games;
        this._options = options;

        this._gamesById = {};
        games.forEach(_ => {
            this._gamesById[_.header.id] = _;
        });

        this._fileServer.setGames(games);

        // initialize home screen
        if (options.game !== undefined) {
            if (options.game in this._gamesById) {
                this._launchGame(options.game);
                return;
            }
        }

        this._homeScreen.init(
            this,
            () => {
                document.body.appendChild(this._homeScreen.root);

                if (ready !== undefined) {
                    ready();
                }
            }
        );
        this._homeScreen.onLaunchGame = id => {
            this._launchGame(id);
        };
    }

    public get games(): GameHeader[] {
        return this._games.map(_ => _.header);
    }

    public assetsHref(url: string): string {
        return this._fileServer.href(url);
    }

    public gamesHref(id: string, url: string): string {
        return this._fileServer.href(`games/${id}/${url}`);
    }

    public gameHref(url: string): string {
        return this._fileServer.href(`game/${url}`);
    }

    public loadGame(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!(id in this._gamesById)) {
                return reject(`unknown game ${id}`);
            }

            const loader = this._gamesById[id];
            this._fileServer.setGame(id);
            return resolve();
        });
    }

    public unloadGame(): Promise<void> {
        return new Promise<void>(resolve => {
            this._fileServer.setGame(undefined);
            this._game.close();
            this._game = undefined;
            return resolve();
        });
    }

    private _launchGame(id: string) {
        console.log(`Launching game ${id}...`);
        this._gameScreen.init(this, id, () => {
            this._homeScreen.root.remove();
            document.body.appendChild(this._gameScreen.root);
        });
    }
}
