//import * as TowerDefense from '@moroboxai-games/towerdefense';
//import * as MoroboxAIGameSDK from 'moroboxai-game-sdk';
import * as staticZip from 'express-static-zip';
import * as net from 'net';
import * as PIXI from 'pixi.js';
import * as querystring from 'querystring';
import * as model from './model';
import * as monad from './monad';
import * as screen from './screen';

class GameInstance implements model.IGameInstance {
    private _options: model.ProgramOptions;
    private _fileServer: monad.ILocalFileServer;
    private _games: model.GameZip[];

    constructor(options: model.ProgramOptions) {
        this._options = options;
    }

    public run() {
        const bootScreen: screen.BootScreen = new screen.BootScreen(
            document.getElementById('boot_screen'),
            {
                gamesDir: this._options.gamesDir,
                minDuration: this._options.bootDuration,
                mainCss: this._options.mainCss
            }
        );
        bootScreen.run((filesServer, games) => {
            this._fileServer = filesServer;
            this._games = games;

            bootScreen.remove();
            const homeScreen = new screen.HomeScreen(
                document.body,
                this
            );
            homeScreen.run();
        });
    }

    public get games(): model.GameZip[] {
        return this._games;
    }

    public href(url: string): string {
        return this._fileServer.href(url);
    }
}

document.addEventListener('DOMContentLoaded', _ => {
    // get back command line arguments from URL query
    const query: querystring.ParsedUrlQuery = querystring.parse(global.location.search);
    const options: model.ProgramOptions = JSON.parse(query['?options'] as string);
    // run game instance
    (new GameInstance(options)).run();
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
