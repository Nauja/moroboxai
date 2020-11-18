export interface Version {
    major: number;
    minor: number;
    patch: number;
}

export interface GameHeader {
    version: Version;
    title: string;
    description: string;
}

export interface GameZip {
    file: string;
    header: GameHeader;
}

/**
 * Main options passed to the program.
 */
export interface ProgramOptions {
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
