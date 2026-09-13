export declare function getParallelKey(groupName: string): string | null;
export declare function areParallelGroups(first: string, second: string): boolean;
export declare function parseGroupNames(raw: string): string[];
export declare function assertParallelGroupSet(groupNames: string[]): void;
export declare function extractGroupNameFromTitle(title: string): string | null;
