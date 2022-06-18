export const HEADER_NAME = 'header.json';

/**
 * Main options passed to the program.
 */
export interface ProgramOptions {
    nativeWidth: number;
    nativeHeight: number;
    host: string;
    port: number;
    cpuDir: string;
    gamesDir: string;
    game?: string;
    mainCss: string;
    bootDuration: number;
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
