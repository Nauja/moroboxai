export interface GameHeader {
    id: string;
    version: string;
    title: string;
    description: string;
    icon: string;
}

export interface GameZip {
    file: string;
    header: GameHeader;
    icon: Buffer;
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
     * Build the absolute URL to a local file.
     *
     * ```js
     * console.log(gameInstance.href('index.html'))
     * // http://host:port/index.html
     * ```
     * @param {string} url - Relative URL.
     * @returns {string} Absolute URL.
     */
    href(url: string): string;
}
