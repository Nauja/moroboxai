import * as path from "path";
import * as fs from "fs";
import { expect } from "@jest/globals";

/**
 * Check that a path is a file.
 */
expect.extend({
    toBeFile(actual) {
        if (typeof actual !== "string") {
            throw new Error("Must be of type string!");
        }

        const relative = path.relative(path.resolve(__dirname, ".."), actual);

        if (!fs.existsSync(actual) || !fs.statSync(actual).isFile()) {
            return {
                pass: false,
                message: () =>
                    `expected ${this.utils.printReceived(
                        relative
                    )} to be an existing file`,
            };
        }

        return {
            pass: true,
            message: () =>
                `expected ${this.utils.printReceived(
                    relative
                )} to not be an existing file`,
        };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeFile(): void;
    }
    interface Matchers<R> {
        toBeFile(): R;
    }
}
