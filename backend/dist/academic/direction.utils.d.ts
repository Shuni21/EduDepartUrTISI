export declare function extractDirectionCode(name: string): string | null;
export declare function normalizeDirectionTitle(name: string): string;
export declare function buildDirectionDisplayName(rawName: string): string;
export declare function buildDirectionStorageCode(rawName: string): string;
export declare function validateDirectionInput(rawName: string): {
    valid: boolean;
    message?: string;
};
export declare function directionsMatchByIdentity(leftName: string, rightName: string): boolean;
