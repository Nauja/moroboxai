/**
 * Check if a string is an URL.
 * @param {string} value - some string
 * @returns if an URL
 */
export default function isValidURL(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
        return false;
    }
}
