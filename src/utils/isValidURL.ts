/**
 * Check if a string is an URL.
 * @param {string} value - some string
 * @returns if an URL
 */
export default function isValidURL(value: string): boolean {
    try {
        return Boolean(new URL(value));
    } catch (e) {
        return false;
    }
}
