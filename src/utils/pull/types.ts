/**
 * Result of pulling a target.
 */
export enum EPullResult {
    Downloaded,
    AlreadyDownloaded,
}

/**
 * Options for overriding the sources or adding extra sources.
 */
export interface SourcesOptions {
    // The list of sources
    sources?: string[];
    // Additional sources
    extraSources?: string[];
}

/**
 * Options for pulling a target.
 */
export type PullOptions = Partial<SourcesOptions> & {
    // Force downloading even if the target exists
    force?: boolean;
    // Unpack the archive
    unpack?: boolean;
    // Destination of the archive
    output?: string;
    // Timeout of the request
    timeout?: number;
};
