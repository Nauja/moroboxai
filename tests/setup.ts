import * as nodePath from "path";
import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as platform from "../src/utils/platform";
import tempDir from "../src/utils/tempDir";

const DATA_DIR = nodePath.join(__dirname, "data");
global.DATA_DIR = DATA_DIR;

const mockExit = jest.spyOn(process, "exit").mockImplementation((number) => {
    if (number !== 0) {
        throw new Error("process.exit: " + number);
    }

    return undefined as never;
});

function deleteFolderRecursive(path: string) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

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
        const file = nodePath.join(rootDir, req.url);
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

beforeEach(async () => {
    return new Promise<void>(async (resolve) => {
        await tempDir({ preserve: true }, async (path) => {
            // Mock the data directory of MoroboxAI storing the config, boots, and games
            const ENV_DIR = path;
            global.ENV_DIR = ENV_DIR;
            const MOROBOXAI_DIR = nodePath.join(ENV_DIR, "moroboxai");
            const GAMES_DIR = nodePath.join(MOROBOXAI_DIR, "games");
            const BOOTS_DIR = nodePath.join(MOROBOXAI_DIR, "boots");
            const SOURCES_LIST = nodePath.join(MOROBOXAI_DIR, "sources.list");

            // Clean the env directory for each test
            fs.rmSync(ENV_DIR, { recursive: true, force: true });
            if (fs.existsSync(ENV_DIR)) {
                throw `Could not delete ${ENV_DIR}`;
            }
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
            resolve();
        });
    });
});

afterEach(() => {
    try {
        fs.rmSync(global.ENV_DIR, { recursive: true, force: true });
    } catch (err) {
        console.error(err);
    }
});
