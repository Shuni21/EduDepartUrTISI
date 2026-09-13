import { ScheduleItem } from './entities/schedule-item.entity';
export declare function isLectureScheduleItem(item: ScheduleItem): boolean;
export declare function isSharedMultiGroupLessonItem(item: ScheduleItem): boolean;
export declare function areLinkedSharedLessonItems(first: ScheduleItem, second: ScheduleItem): boolean;
export declare function areLinkedLectureItems(first: ScheduleItem, second: ScheduleItem): boolean;
export declare function findLinkedLectureItemsInList(item: ScheduleItem, candidates: ScheduleItem[]): ScheduleItem[];
export declare function extractLinkedGroupNames(items: ScheduleItem[]): string[];
export declare function buildLinkedGroupsMap(items: ScheduleItem[]): Map<number, string[]>;
