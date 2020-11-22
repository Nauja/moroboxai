import * as concat from 'concat-stream';
import * as http from 'http';
import * as model from '../model';
import { createElement } from '../model';
import * as monad from '../monad';

const BOOT_FUNCTION_PREFIX: string = 'moroboxai:gameboot:';

/**
 * This screen takes care of game boot.
 *
 * Booting a game consists of:
 * * Creating an iframe containing the game code and view.
 * * Making that iframe load an entrypoint .js file bundled with the game.
 * * We will receive a message from that iframe when fully loaded and ready.
 * * This message contains the name of the boot function to call.
 * * Call that boot function to start the game.
 */
export class Screen {
    // root HTMLElement.
    public readonly root: HTMLElement;
    // iframe embedding the game code and view.
    private _background: HTMLElement;
    private _script: HTMLElement;
    // will listen to message events.
    private _messageListener: (evt: MessageEvent) => void;

    constructor() {
        this.root = createElement('div', {
            id: 'mai_game_screen',
            class: 'mai_screen'
        });

        this._background = createElement('div', {
            class: 'mai_background'
        });
        this.root.appendChild(this._background);

        this._script = createElement('script', {});
        this._script.setAttribute('type', 'text/javascript');
        this.root.appendChild(this._script);
    }

    public init(gameInstance: model.IGameInstance, game: model.GameZip, ready?: () => void): void {
        // set ready right now to transition to this screen
        if (ready !== undefined) {
            ready();
        }

        // start loading the game into memory
        gameInstance.loadGame(game, err => {
            if (err) {
                console.error('Failed to load game');
                return;
            }

            // wait to receive the boot function
            this._messageListener = evt => {
                const data: string = evt.data as string;
                if (data !== undefined && data.startsWith(BOOT_FUNCTION_PREFIX)) {
                    // call boot function in iframe to initialize the game
                    //this._iframe.contentWindow[data.substr(BOOT_FUNCTION_PREFIX.length)]();
                }
            };
            window.addEventListener('message', this._messageListener, true);
            // splashart displayed in background while loading game
            this._background.style.backgroundImage = `url("${gameInstance.gameHref(game.header.splashart)}")`;
            // embedded the game view into our iframe
            console.log(gameInstance.gameHref(game.header.boot));
            http.get(gameInstance.gameHref(game.header.boot), res => {
                res.setEncoding('utf8');
                res.pipe(concat({ encoding: 'string' }, remoteSrc => {
                    const boot = eval(remoteSrc);
                    const sdk = new monad.EmbeddedGameSDK(gameInstance);
                    boot({
                        root: this._background,
                        sdk
                    });
                    sdk.notifyReady();
                }));
            });
        });
    }

    public dispose(): void {
        if (this._messageListener !== undefined) {
            window.removeEventListener('message', this._messageListener);
            this._messageListener = undefined;
        }
    }
}
