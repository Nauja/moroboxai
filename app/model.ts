export interface GameHeader {
    id: string;
    version: string;
    title: string;
    description: string;
    icon: string;
    preview: string;
    splashart: string;
    boot: string;
}

export interface GameZip {
    file: string;
    header: GameHeader;
    icon: Buffer;
    preview: Buffer;
}

/**
 * Main options passed to the program.
 */
export interface ProgramOptions {
    nativeWidth: number;
    nativeHeight: number;
    host: string;
    port: number;
    gamesDir: string;
    mainCss: string;
    bootDuration: number;
}

export interface IGameInstance {
    /**
     * Loaded games.
     */
    readonly games: GameZip[];

    /**
     * Load a game into memory.
     * @param {model.GameZip} game - Game .zip file.
     * @param {function} callback - Called when done.
     */
    loadGame(game: GameZip, callback: (err: any) => void): void;

    /**
     * Unload currently loaded game.
     * @param {function} callback - Called when done.
     */
    unloadGame(callback: () => void): void;

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
    gamesHref(game: GameZip, url: string): string;
    gameHref(url: string): string;
}

export function createElement(tag, options: any): HTMLElement {
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
