import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as platform from "../src/utils/platform";

// Directory cleaned before each test
const ENV_DIR = path.resolve(__dirname, "env");
const DATA_DIR = path.resolve(__dirname, "data");
global.ENV_DIR = ENV_DIR;
global.DATA_DIR = DATA_DIR;

// Mock the data directory of MoroboxAI storing the config, boots, and games
const MOROBOXAI_DIR = path.join(ENV_DIR, "moroboxai");
const GAMES_DIR = path.join(MOROBOXAI_DIR, "games");
const BOOTS_DIR = path.join(MOROBOXAI_DIR, "boots");
const SOURCES_LIST = path.join(MOROBOXAI_DIR, "sources.list");

/**
 * Default route for serving local files.
 * @param {string} rootDir - directory to serve from
 */
function serveLocalFiles(rootDir: string) {
    return (req: http.IncomingMessage, res: http.ServerResponse): void => {
        // invalid URL
        if (req.url === undefined) {
            res.writeHead(404);
            res.end();
            return;
        }

        // check if requested path is a file
        const file = path.join(rootDir, req.url);
        fs.stat(file, (e, stats) => {
            if (e || !stats.isFile()) {
                console.error(e);
                res.writeHead(404);
                res.end();
                return;
            }

            // read and return file content
            res.end(fs.readFileSync(file));
        });
    };
}

// Server for serving files from the data dir
const FILE_SERVER = http.createServer(serveLocalFiles(DATA_DIR));

beforeAll(async () => {
    return new Promise<void>((resolve) => {
        // Keep a reference for cleanup
        FILE_SERVER.listen(0, "127.0.0.1", () => {
            const address = FILE_SERVER.address() as net.AddressInfo;
            console.log(`File server started on port ${address.port}`);
            global.FILE_SERVER_URL = `http://127.0.0.1:${address.port}`;

            resolve();
        });
    });
});

afterAll(() => {
    // Close the server
    console.log("Closing file server");
    FILE_SERVER.close();
});

beforeEach(() => {
    // Clean the env directory for each test
    fs.rmSync(ENV_DIR, { recursive: true, force: true });
    [GAMES_DIR, BOOTS_DIR].forEach((dir) =>
        fs.mkdirSync(dir, { recursive: true })
    );
    global.ENV_DIR = ENV_DIR;

    // Mock paths to the data directory
    (platform.DATA_DIR as any) = MOROBOXAI_DIR;
    (platform.GAMES_DIR as any) = GAMES_DIR;
    (platform.BOOTS_DIR as any) = BOOTS_DIR;
    (platform.SOURCES_LIST as any) = SOURCES_LIST;
    (platform.CWD as any) = ENV_DIR;

    fs.writeFileSync(SOURCES_LIST, global.FILE_SERVER_URL);
});
