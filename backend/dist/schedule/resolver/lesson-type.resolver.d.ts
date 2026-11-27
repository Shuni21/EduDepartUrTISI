import { Repository } from 'typeorm';
import { LessonType } from '../entities/lesson-type.entity';
export declare class LessonTypeResolver {
    private readonly lessonTypesRepository;
    constructor(lessonTypesRepository: Repository<LessonType>);
    private mapRawToCode;
    private mapCodeToName;
    resolve(rawLessonType: string): Promise<LessonType>;
}
