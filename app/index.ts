/**
 * Entrypoint of the application.
 */
import * as engine from "./engine";
import { GameInstance } from "./engine";
import { ProgramOptions } from "./model";
import { ICPULoader } from "./monad/cpu";
import { IGameLoader } from "./monad/game";
import { ILocalFileServer, LocalFileServer } from "./monad/server";

document.addEventListener("DOMContentLoaded", (event) => {
    const querystring = require("querystring");
    const monadcpu = require("./monad/cpu");
    const monadgame = require("./monad/game");
    const monadserver = require("./monad/server");

    // get back command line arguments from URL query
    const query = querystring.parse(global.location.search);
    const options: ProgramOptions = JSON.parse(query["?options"] as string);

    /**
     * Handle resizing the window.
     * @param {UIEvent} [evt] - Resize event.
     */
    function resize(evt?: UIEvent) {
        const widthRatio = document.body.clientWidth / options.nativeWidth;
        const heightRatio = document.body.clientHeight / options.nativeHeight;
        document.body.style.fontSize = `${widthRatio}em`;
    }

    // first resize for initial window size
    window.addEventListener("resize", resize);
    resize();

    function injectAssets(
        fileServer: ILocalFileServer,
        callback: () => void
    ): void {
        Promise.all([
            new Promise<void>((resolve, reject) => {
                // inject main CSS dynamically in head
                const item = document.createElement("link");
                item.rel = "stylesheet";
                item.type = "text/css";
                item.href = fileServer.href(options.mainCss);
                item.onload = () => {
                    // everything fine
                    console.log(`Loaded ${options.mainCss}`);
                    resolve();
                };
                item.onerror = (evt, source, lineno, colno, error) => {
                    // some error
                    console.error(`Error loading ${options.mainCss}: ${error}`);
                    resolve();
                };
                document.head.appendChild(item);
            }),
            new Promise<void>((resolve, reject) => {
                // inject font dynamically in head
                const item = document.createElement("style");
                item.innerText =
                    "@font-face {" +
                    'font-family: "8bit";' +
                    `src: url("${fileServer.href(
                        "assets/8bitwonder.TTF"
                    )}") format("truetype");` +
                    "}";
                item.onload = () => {
                    // everything fine
                    console.log(`Loaded font 8bit`);
                    resolve();
                };
                item.onerror = (evt, source, lineno, colno, error) => {
                    // some error
                    console.error(`Error loading font 8bit: ${error}`);
                    resolve();
                };
                document.head.appendChild(item);
            }),
        ]).then(callback);
    }

    function injectCPUs(
        fileServer: ILocalFileServer,
        cpus: ICPULoader[],
        callback: () => void
    ): void {
        Promise.all(
            cpus.map(
                (_) =>
                    new Promise<void>((resolve) => {
                        // inject main CSS dynamically in head
                        const item = document.createElement("script");
                        item.type = "text/javascript";
                        item.src = fileServer.href(`cpu/${_.file}`);
                        item.onload = () => {
                            // everything fine
                            console.log(`Loaded ${_.file}`);
                            resolve();
                        };
                        item.onerror = (evt, source, lineno, colno, error) => {
                            // some error
                            console.error(`Error loading ${_.file}: ${error}`);
                            resolve();
                        };
                        document.head.appendChild(item);
                    })
            )
        ).then(callback);
    }

    /**
     * Boot process.
     *
     * It performs some tasks before displaying menus:
     * * Start the LocalFileServer.
     * * Load the main CSS file before displaying menus.
     * * Read games headers from game directory.
     * @param {function} callback - Function called when done.
     */
    function boot(
        callback: (
            fileServer: ILocalFileServer,
            games: IGameLoader[],
            cpus: ICPULoader[]
        ) => void
    ): void {
        const fileServer: LocalFileServer = new monadserver.LocalFileServer();
        const games = new Array<IGameLoader>();
        const cpus = new Array<ICPULoader>();

        Promise.all([
            Promise.all([
                new Promise<void>((resolve, _) => {
                    // task for initializing the local file server
                    fileServer.ready(() => {
                        console.log(
                            `LocalFileServer started on port ${fileServer.port}`
                        );
                        // load external assets
                        injectAssets(fileServer, resolve);
                    });
                    fileServer.listen();
                }),
                new Promise<void>((resolve, _) => {
                    // task for listing all the games
                    monadcpu
                        .listCPUs(options.cpuDir, (cpu: ICPULoader) => {
                            cpus.push(cpu);
                        })
                        .then(() => {
                            console.log(`Found ${cpus.length} cpu(s)`);
                            fileServer.setCPUs(cpus);
                            injectCPUs(fileServer, cpus, resolve);
                        });
                }),
            ]),
            new Promise<void>((resolve, _) => {
                // task for listing all the games
                monadgame
                    .listGames(options.gamesDir, (game: IGameLoader) => {
                        games.push(game);
                    })
                    .then(() => {
                        console.log(`Found ${games.length} game(s)`);
                        resolve();
                    });
            }),
            new Promise<void>((resolve, _) => {
                // force waiting a little
                setTimeout(resolve, options.bootDuration);
            }),
        ])
            .then(() => {
                callback(fileServer, games, cpus);
            })
            .catch((e) => {
                console.error(e);
                console.error("Boot failed, see errors above");
            });
    }

    // start boot process
    boot((fileServer, games, cpus) => {
        console.log("Boot done");
        // really start moroboxai
        const gameInstance: GameInstance = new engine.GameInstance();
        gameInstance.init(fileServer, games, options, () => {
            // ready, destroy boot screen
            document.getElementById("mai_boot_screen").remove();
        });
    });
});
