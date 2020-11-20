import StreamZip = require('node-stream-zip');
import * as model from './model';
import * as monad from './monad';
import * as screen from './screen';

export class GameInstance implements model.IGameInstance {
    private _fileServer: monad.ILocalFileServer;
    private _games: model.GameZip[];
    private _game: StreamZip;
    private _options: model.ProgramOptions;
    private _homeScreen: screen.HomeScreen = new screen.HomeScreen();
    private _gameScreen: screen.GameScreen = new screen.GameScreen();

    public init(fileServer: monad.ILocalFileServer, games: model.GameZip[], options: model.ProgramOptions, ready?: () => void) {
        this._fileServer = fileServer;
        this._games = games;
        this._options = options;

        this._fileServer.setGames(games);

        // initialize home screen
        this._homeScreen.init(
            this,
            () => {
                document.body.appendChild(this._homeScreen.root);

                if (ready !== undefined) {
                    ready();
                }
            }
        );
        this._homeScreen.onLaunchGame = game => {
            this._launchGame(game);
        };
    }

    public get games(): model.GameZip[] {
        return this._games;
    }

    public assetsHref(url: string): string {
        return this._fileServer.href(url);
    }

    public gamesHref(game: model.GameZip, url: string): string {
        return this._fileServer.href(`games/${game.header.id}/${url}`);
    }

    public gameHref(url: string): string {
        return this._fileServer.href(`game/${url}`);
    }

    public loadGame(game: model.GameZip, callback: (err: any) => void): void {
        monad.loadZip(`${game.file}`, (err, zip) => {
            if (err) {
                callback(err);
                return;
            }

            this._game = zip;
            this._fileServer.setGame(game, zip);
            callback(undefined);
        });
    }

    public unloadGame(callback: () => void): void {
        this._fileServer.setGame(undefined, undefined);
        this._game.close();
        this._game = undefined;
        callback();
    }

    private _launchGame(game: model.GameZip) {
        console.log(`Launching game ${game.header.title}...`);
        this._gameScreen.init(this, game, () => {
            this._homeScreen.root.remove();
            document.body.appendChild(this._gameScreen.root);
        });
    }
}
