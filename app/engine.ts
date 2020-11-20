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
            this._fileServer.setGame(zip);
            callback(undefined);
        });
    }

    public unloadGame(callback: () => void): void {
        this._fileServer.setGame(undefined);
        this._game.close();
        this._game = undefined;
        callback();
    }

    private _launchGame(game: model.GameZip) {
        console.log(`Launching game ${game.header.title}...`);
        this._gameScreen.init(this, game, () => {
            this._homeScreen.root.remove();
            document.body.appendChild(this._gameScreen.root);
            console.log('Game ready');
        });
    }
}

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

/*
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
*/
