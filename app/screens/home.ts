import * as model from '../model';

function createElement(tag, options: any): HTMLElement {
    const newPanel = document.createElement(tag);
    if (options.id !== undefined) {
        newPanel.id = options.id;
    }
    if (options.class !== undefined) {
        newPanel.className = options.class;
    }
    if (options.text !== undefined) {
        newPanel.innerHTML = options.text;
    }
    return newPanel;
}

class GameListItem {
    public readonly root: HTMLElement;
    public readonly data: model.GameZip;

    constructor(gameInstance: model.IGameInstance, data: model.GameZip) {
        this.root = createElement('article', {
            class: 'mai_item'
        });
        this.data = data;

        const img = createElement('img', {
            class: 'mai-icon'
        });
        img.setAttribute('src', gameInstance.href(`games/${data.header.id}/icon`));
        this.root.appendChild(img);
        this.root.appendChild(createElement('header', {
            text: data.header.title
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
    public onGameSelected: (game: model.GameZip) => void;
    private _gameInstance: model.IGameInstance;
    private _items: GameListItem[];
    private _selectedIndex: number;

    constructor(gameInstance: model.IGameInstance) {
        this.root = createElement('div', {
            id: 'mai_game_list'
        });
        this._gameInstance = gameInstance;
    }

    public update(games: model.GameZip[]) {
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
            this.onGameSelected(this._items[index].data);
        }
    }
}

class GameInfo {
    public readonly root: HTMLElement;

    constructor() {
        this.root = createElement('div', {
            id: 'mai_game_info'
        });
    }

    public update(game: model.GameZip) {
        console.log('test');
    }
}

export class Screen {
    public readonly root: HTMLElement;
    private _gameInstance: model.IGameInstance;
    private _gameList: GameList;
    private _gameInfo: GameInfo;

    constructor() {
        this.root = createElement('div', {
            id: 'mai_home_screen',
            class: 'mai_screen'
        });
    }

    public init(gameInstance: model.IGameInstance, ready?: () => void): void {
        this._gameInstance = gameInstance;
        this._gameList = new GameList(gameInstance);
        this._gameInfo = new GameInfo();
        this.root.appendChild(this._gameList.root);
        this.root.appendChild(this._gameInfo.root);

        const games = this._gameInstance.games;
        this._gameList.onGameSelected = game => {
            this._onGameSelected(game);
        };
        this._gameList.update(games);
        this._gameList.select(0);

        if (ready !== undefined) {
            ready();
        }
    }

    private _onGameSelected(game: model.GameZip) {
        this._gameInfo.update(game);
    }
}
