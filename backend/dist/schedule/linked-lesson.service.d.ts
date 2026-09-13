import { Repository } from 'typeorm';
import { ScheduleItem } from './entities/schedule-item.entity';
export declare class LinkedLessonService {
    private readonly itemsRepository;
    constructor(itemsRepository: Repository<ScheduleItem>);
    findLinkedSharedLessonItems(item: ScheduleItem): Promise<ScheduleItem[]>;
    buildLinkedGroupsMap(items: ScheduleItem[]): Promise<Map<number, string[]>>;
}
