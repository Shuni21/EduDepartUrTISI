import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LessonType, LessonTypeCode } from '../entities/lesson-type.entity';
import {
    compactLessonType,
    isCreditLessonType,
    isKpDefenseLessonType,
    isKrDefenseLessonType,
} from '../parser/lesson-type.utils';

@Injectable()
export class LessonTypeResolver {
    constructor(
        @InjectRepository(LessonType)
        private readonly lessonTypesRepository: Repository<LessonType>,
    ) {}

    private mapRawToCode(raw: string): LessonTypeCode {
        const compact = compactLessonType(raw);

        if (compact.startsWith('лек')) return LessonTypeCode.LECTURE;
        if (compact.startsWith('практ')) return LessonTypeCode.PRACTICE;
        if (compact.startsWith('лаб')) return LessonTypeCode.LAB;
        if (isKpDefenseLessonType(raw)) return LessonTypeCode.KP_DEFENSE;
        if (isKrDefenseLessonType(raw)) return LessonTypeCode.KR_DEFENSE;
        if (isCreditLessonType(raw)) return LessonTypeCode.CREDIT;
        if (compact.includes('куратор') || compact === 'особое' || compact === 'особенное') {
            return LessonTypeCode.SPECIAL;
        }

        return LessonTypeCode.PRACTICE;
    }

    private mapCodeToName(code: LessonTypeCode, raw: string): string {
        if (raw.toLowerCase().includes('куратор') || raw.toLowerCase() === 'особое') {
            return 'Особое';
        }

        switch (code) {
            case LessonTypeCode.LECTURE: return 'Лекция';
            case LessonTypeCode.PRACTICE: return 'Практика';
            case LessonTypeCode.LAB: return 'Лаб. раб.';
            case LessonTypeCode.CREDIT: return 'Зачёт';
            case LessonTypeCode.KR_DEFENSE: return 'Защита КР';
            case LessonTypeCode.KP_DEFENSE: return 'Защита КП';
            case LessonTypeCode.SPECIAL: return 'Особое';
            default: return raw.trim();
        }
    }

    async resolve(rawLessonType: string): Promise<LessonType> {
        const code = this.mapRawToCode(rawLessonType);
        const name = this.mapCodeToName(code, rawLessonType);

        let lessonType = await this.lessonTypesRepository.findOne({
            where: { name },
        });

        if (!lessonType) {
            lessonType = await this.lessonTypesRepository.findOne({
                where: { code },
            });
        }

        if (!lessonType) {
            lessonType = await this.lessonTypesRepository.save(
                this.lessonTypesRepository.create({ code, name }),
            );
        }

        return lessonType;
    }
}