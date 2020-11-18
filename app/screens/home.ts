import * as model from '../model';

export class Screen {
    private _root: HTMLElement;
    private _gameInstance: model.IGameInstance;

    constructor(root: HTMLElement, gameInstance: model.IGameInstance) {
        this._root = root;
        this._gameInstance = gameInstance;
    }

    public run(): void {
        const newPanel = document.createElement('div');
        newPanel.id = 'home_screen';
        newPanel.className = 'screen';
        const gameList = document.createElement('ul');
        newPanel.appendChild(gameList);
        document.body.appendChild(newPanel);
        this._gameInstance.games.forEach(game => {
            const label = document.createElement('li');
            label.textContent = game.header.title;
            gameList.appendChild(label);
        });
    }
}
