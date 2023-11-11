import * as fs from "fs";
import { expect } from "@jest/globals";

expect.extend({
    toBeEqualDirectory(actual, other) {
        if (typeof actual !== "string") {
            throw new Error("Must be of type string!");
        }

        const actualFiles = fs.readdirSync(actual, {
            recursive: true,
        }) as string[];
        const expectedFiles = fs.readdirSync(actual, {
            recursive: true,
        }) as string[];

        console.log(actualFiles);
        console.log(expectedFiles);

        if (
            actualFiles.every((file) => expectedFiles.includes(file)) &&
            expectedFiles.every((file) => actualFiles.includes(file))
        ) {
            return {
                pass: true,
                message: () =>
                    `expected ${this.utils.printReceived(
                        actual
                    )} and ${this.utils.printExpected(other)} to be equal`,
            };
        }

        return {
            pass: false,
            message: () =>
                `expected ${this.utils.printReceived(
                    actual
                )} and ${this.utils.printExpected(other)} to not be equal`,
        };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeEqualDirectory(value: string): void;
    }
    interface Matchers<R> {
        toBeEqualDirectory(value: string): R;
    }
}
