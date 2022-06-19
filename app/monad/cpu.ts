import * as fs from 'fs';
import * as path from 'path';

export interface ICPULoader {
    file: string;
    load(): Promise<Buffer>;
}

class CPUFromFileLoader implements ICPULoader {
    private _fullpath: string;
    private _file: string;

    constructor(fullpath: string, file: string) {
        this._fullpath = fullpath;
        this._file = file;
    }

    get file(): string {
        return this._file;
    }

    load(): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(this._fullpath, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve(data);
            });
        });
    }
}

/**
 * List the CPUs from a directory.
 * @param {string} root - Parent directory.
 * @param {function} cpuFound - Function called for each CPU.
 * @returns {Promise} When all CPUs have been processed
 */
export function listCPUs(root: string, cpuFound: (cpu: ICPULoader) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.readdir(root, (err, files) => {
            // couldn't access the directory
            if (err) {
                return reject(err);
            }

            // run everything concurrently
            const cpus = files.filter(_ => _.endsWith('.js')).map(_ => new CPUFromFileLoader(path.join(root, _), _));
            cpus.forEach(_ => cpuFound(_));
            return resolve();
        });
    });
}
