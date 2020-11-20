import * as model from '../model';
import { createElement } from '../model';

export class Screen {
    public readonly root: HTMLElement;
    private _gameInstance: model.IGameInstance;
    private _game: model.GameZip;
    private _background: HTMLElement;
    private _script: HTMLElement;

    constructor() {
        this.root = createElement('div', {
            id: 'mai_game_screen',
            class: 'mai_screen'
        });

        this._background = createElement('div', {
            class: 'mai_background'
        });
        this.root.appendChild(this._background);
    }

    public init(gameInstance: model.IGameInstance, game: model.GameZip, ready?: () => void): void {
        this._gameInstance = gameInstance;
        this._game = game;

        if (ready !== undefined) {
            ready();
        }

        gameInstance.loadGame(game, err => {
            if (err) {
                console.error('Failed to load game');
                return;
            }

            console.log('set background');
            console.log(this._gameInstance.gameHref(game.header.splashart));
            this._background.style.backgroundImage = `url("${this._gameInstance.gameHref(game.header.splashart)}")`;
            this._script = createElement('script', {});
            this._script.setAttribute('type', 'text/javascript');
            this._script.setAttribute('src', this._gameInstance.gameHref(game.header.boot));
            this.root.appendChild(this._script);
        });
    }
}
