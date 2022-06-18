import { GameHeader } from 'moroboxai-game-sdk';
import { IGameInstance } from '../engine';
import * as model from '../model';
import { createElement } from '../model';
import { IGameLoader } from '../monad/game';

class GameListItem {
    public readonly root: HTMLElement;
    public readonly game: GameHeader;

    constructor(gameInstance: IGameInstance, game: GameHeader) {
        this.root = createElement('article', {
            class: 'mai_item'
        });
        this.game = game;

        const img = createElement('img', {
            class: 'mai-icon'
        });
        img.setAttribute('src', gameInstance.gamesHref(game.id, 'icon'));
        this.root.appendChild(img);
        this.root.appendChild(createElement('header', {
            text: game.title
        }));
        this.root.appendChild(createElement('body', {
            text: '&nbsp;-&nbsp;1.0.0'
        }));
    }

    public setSelected(value: boolean): void {
        if (value) {
            this.root.className = 'mai-selected';
        } else {
            this.root.className = '';
        }
    }
}

class GameList {
    public readonly root: HTMLElement;
    public onGameSelected: (game: GameHeader) => void;
    public onGameClicked: (game: GameHeader) => void;
    private _gameInstance: IGameInstance;
    private _items: GameListItem[];
    private _selectedIndex: number;

    constructor(gameInstance: IGameInstance) {
        this.root = createElement('div', {
            id: 'mai_game_list'
        });
        this._gameInstance = gameInstance;
    }

    public update(games: GameHeader[]) {
        // clear old content
        this.root.innerHTML = '';
        this._items = new Array<GameListItem>();
        this._selectedIndex = -1;

        // add games
        games.forEach((game, index) => {
            const item = new GameListItem(this._gameInstance, game);
            this._items.push(item);

            this.root.appendChild(item.root);
            item.root.addEventListener('mouseover', () => {
                this.select(index);
            });
            item.root.addEventListener('mouseup', () => {
                if (this.onGameClicked !== undefined) {
                    this.onGameClicked(game);
                }
            });
        });
    }

    public select(index: number): void {
        if (index < 0 || index >= this._items.length || index === this._selectedIndex) {
            return;
        }

        // unselect old item
        if (this._selectedIndex >= 0) {
            this._items[this._selectedIndex].setSelected(false);
        }

        // select new item
        this._selectedIndex = index;
        this._items[index].setSelected(true);
        if (this.onGameSelected !== undefined) {
            this.onGameSelected(this._items[index].game);
        }
    }
}

class GameInfo {
    public readonly root: HTMLElement;
    private _gameInstance: IGameInstance;
    private _img: HTMLElement;
    private _description: HTMLElement;

    constructor(gameInstance: IGameInstance) {
        this.root = createElement('div', {
            id: 'mai_game_info'
        });
        this._gameInstance = gameInstance;

        this._img = createElement('img', {
            class: 'mai-preview'
        });
        this.root.appendChild(this._img);

        this._description = createElement('span', {
            class: 'mai-preview'
        });
        this.root.appendChild(this._description);
    }

    public update(game: GameHeader) {
        this._img.setAttribute('src', this._gameInstance.gamesHref(game.id, 'preview'));
        this._description.innerHTML = game.description;
    }
}

export class Screen {
    public readonly root: HTMLElement;
    public onLaunchGame: (id: string) => void;
    private _gameInstance: IGameInstance;
    private _gameList: GameList;
    private _gameInfo: GameInfo;

    constructor() {
        this.root = createElement('div', {
            id: 'mai_home_screen',
            class: 'mai_screen'
        });
    }

    public init(gameInstance: IGameInstance, ready?: () => void): void {
        this._gameInstance = gameInstance;
        this._gameList = new GameList(gameInstance);
        this._gameInfo = new GameInfo(gameInstance);
        this.root.appendChild(this._gameList.root);
        this.root.appendChild(this._gameInfo.root);

        const games = this._gameInstance.games;
        this._gameList.onGameSelected = game => {
            this._onGameSelected(game);
        };
        this._gameList.onGameClicked = game => {
            this._onGameClicked(game);
        };
        this._gameList.update(games);
        this._gameList.select(0);

        if (ready !== undefined) {
            ready();
        }
    }

    private _onGameSelected(game: GameHeader) {
        this._gameInfo.update(game);
    }

    private _onGameClicked(game: GameHeader) {
        if (this.onLaunchGame !== undefined) {
            this.onLaunchGame(game.id);
        }
    }
}
