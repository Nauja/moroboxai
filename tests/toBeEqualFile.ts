import * as fs from "fs";
import { expect } from "@jest/globals";

expect.extend({
    toBeEqualFile(actual, other) {
        if (typeof actual !== "string") {
            throw new Error("Must be of type string!");
        }

        const actualSize = fs.statSync(actual).size;
        const expectedSize = fs.statSync(other).size;
        if (actualSize != expectedSize) {
            return {
                pass: false,
                message: () =>
                    `expected ${this.utils.printReceived(
                        actual
                    )} and ${this.utils.printExpected(
                        other
                    )} to be have equal size ${this.utils.printReceived(
                        actualSize
                    )} != ${expectedSize}`,
            };
        }

        return {
            pass: true,
            message: () =>
                `expected ${this.utils.printReceived(
                    actual
                )} and ${this.utils.printExpected(other)} to not be equal`,
        };
    },
});

declare module "expect" {
    interface AsymmetricMatchers {
        toBeEqualFile(value: string): void;
    }
    interface Matchers<R> {
        toBeEqualFile(value: string): R;
    }
}
