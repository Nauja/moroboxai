import * as path from "path";
import * as fs from "fs";
import { expect } from "@jest/globals";
import * as platform from "../src/utils/platform";

/**
 * Check that a game is installed.
 */
expect.extend({
    toBeInstalledGame(actual) {
        if (typeof actual !== "string") {
            throw new Error("Must be of type string!");
        }

        if (!fs.existsSync(path.join(platform.GAMES_DIR, `${actual}.zip`))) {
            return {
                pass: false,
                message: () =>
                    `expected ${(this as any).utils.printReceived(
                        actual
                    )} game to be installed`,
            };
        }

        return {
            pass: true,
            message: () =>
                `expected ${(this as any).utils.printReceived(
                    actual
                )} game to not be installed`,
        };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeInstalledGame(): void;
    }
    interface Matchers<R> {
        toBeInstalledGame(): R;
    }
}
