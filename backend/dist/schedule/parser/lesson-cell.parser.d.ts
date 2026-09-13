export interface ParsedLessonPart {
    subject: string;
    lessonType: string;
    subgroup: number | null;
    teacherPosition: string;
    teacherName: string;
    isSameCellParallel: boolean;
}
export declare function isIgnorableLessonCell(rawText: string | null | undefined): boolean;
export declare function parseLessonCell(rawText: string): ParsedLessonPart[];
export declare function isDistanceRoom(room: string | null | undefined): boolean;
export declare function isAuditoriumRoomLabel(room: string | null | undefined): boolean;
export declare function isSharedMultiHallRoom(room: string | null | undefined): boolean;
export declare function splitRoomForSubgroups(room: string | null | undefined, partsCount: number): (string | null)[];
