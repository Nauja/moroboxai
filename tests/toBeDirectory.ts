import * as path from "path";
import * as fs from "fs";
import { expect } from "@jest/globals";

/**
 * Check that a path is a directory.
 */
expect.extend({
    toBeDirectory(actual) {
        if (typeof actual !== "string") {
            throw new Error("Must be of type string!");
        }

        const relative = path.relative(path.resolve(__dirname, ".."), actual);

        if (!fs.existsSync(actual) || !fs.statSync(actual).isDirectory()) {
            return {
                pass: false,
                message: () =>
                    `expected ${this.utils.printReceived(
                        relative
                    )} to be an existing directory`,
            };
        }

        return {
            pass: true,
            message: () =>
                `expected ${this.utils.printReceived(
                    relative
                )} to not be an existing directory`,
        };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeDirectory(): void;
    }
    interface Matchers<R> {
        toBeDirectory(): R;
    }
}
