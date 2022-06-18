import * as MoroboxAIPlayer from 'moroboxai-player-web';
import { IGameInstance } from '../engine';
import { createElement } from '../model';

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

    public init(gameInstance: IGameInstance, gameId: string, ready?: () => void): void {
        // set ready right now to transition to this screen
        if (ready !== undefined) {
            ready();
        }

        // start loading the game into memory
        gameInstance.loadGame(gameId).then(() => {
            MoroboxAIPlayer.init(this._background, {
                url: gameInstance.gameHref('/'),
                autoPlay: true,
                resizable: true
            });
        }).catch(() => {
            console.error('Failed to load game, see errors above');
        });
    }

    public dispose(): void {
        if (this._messageListener !== undefined) {
            window.removeEventListener('message', this._messageListener);
            this._messageListener = undefined;
        }
    }
}
