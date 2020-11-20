document.addEventListener('DOMContentLoaded', event => {
    const path = require('path');
    const querystring = require('querystring');
    const monad = require('./monad');

    // get back command line arguments from URL query
    const query = querystring.parse(global.location.search);
    const options = JSON.parse(query['?options'] as string);

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
    window.addEventListener('resize', resize);
    resize();

    function injectAssets(fileServer, callback: () => void) : void {
        Promise.all([
            new Promise((resolve, reject) => {
                // inject main CSS dynamically in head
                const item = document.createElement('link');
                item.rel = 'stylesheet';
                item.type = 'text/css';
                item.href = fileServer.href(options.mainCss);
                item.onload = () => {
                    // everything fine
                    console.log(`Loaded ${options.mainCss}`);
                    callback();
                };
                item.onerror = (evt, source, lineno, colno, error) => {
                    // some error
                    console.error(`Error loading ${options.mainCss}: ${error}`);
                    callback();
                };
                document.head.appendChild(item);
            }),
            new Promise((resolve, reject) => {
                // inject font dynamically in head
                const item = document.createElement('style');
                item.innerText = '@font-face {' +
                    'font-family: "8bit";' +
                    `src: url("${fileServer.href('assets/8bitwonder.TTF')}") format("truetype");` +
                    '}';
                item.onload = () => {
                    // everything fine
                    console.log(`Loaded font 8bit`);
                    callback();
                };
                item.onerror = (evt, source, lineno, colno, error) => {
                    // some error
                    console.error(`Error loading font 8bit: ${error}`);
                    callback();
                };
                document.head.appendChild(item);
            })
        ]).then(callback);
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
    function boot(callback: (fileServer, games) => void): void {
        const fileServer = new monad.LocalFileServer();
        let loadedGames;
        Promise.all([
            new Promise((resolve, reject) => {
                // initialize local file server
                fileServer.listen(() => {
                    console.log(`LocalFileServer started on port ${fileServer.port}`);
                    // load external assets
                    injectAssets(fileServer, resolve);
                });
            }),
            new Promise((resolve, reject) => {
                // load games headers
                loadGames(options.gamesDir, games => {
                    loadedGames = games;
                    console.log(`Loaded ${games.length} game(s)`);
                    resolve();
                });
            }),
            new Promise((resolve, reject) => {
                // force waiting a little
                setTimeout(resolve, options.bootDuration);
            })
        ]).then(() => {
            callback(fileServer, loadedGames);
        }).catch(() => {
            console.error('Boot failed, see error above');
        });
    }

    /**
     * Load all valid games from a directory.
     *
     * ```js
     * loadGames('/some/dir', games => {
     *     console.log(games);
     * });
     * ```
     *
     * Each game is bundled in a .zip file containing a header.json
     * file describing the game.
     * @param {string} root - Games directory.
     * @param {function} callback - Called on completion.
     */
    function loadGames(root: string, callback: (games) => void) {
        const games: Array<any> = Array<any>();

        console.log(`Loading games from "${root}" directory...`);
        // list .zip files contained in directory
        monad.listZipFiles(root, (err, files) => {
            // an IO error occured
            if (err !== undefined) {
                console.error(`Failed to load games: ${err}`);
                callback(games);
                return;
            }

            // load headers from .zip files
            monad.loadGameZips(
                files.map(_ => path.join(root, _)),
                (e, game) => {
                    // incorrect game, discard
                    if (e) {
                        console.error(`Failed to load game ${game.file}: ${e}`);
                        return;
                    }

                    // correct game, keep it
                    console.log(`Loaded game ${game.header.title} from ${game.file}`);
                    games.push(game);
                },
                () => {
                    // done
                    callback(games);
                }
            );
        });
    }

    // start boot process
    boot((fileServer, games) => {
        console.log('Boot done');
        // really start moroboxai
        const engine = require('./engine');
        const gameInstance = new engine.GameInstance();
        gameInstance.init(fileServer, games, options, () => {
            // ready, destroy boot screen
            console.log('Home menu ready');
            document.getElementById('mai_boot_screen').remove();
        });
    });
});
