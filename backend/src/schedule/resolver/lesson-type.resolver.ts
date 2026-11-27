import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LessonType, LessonTypeCode } from '../entities/lesson-type.entity';

@Injectable()
export class LessonTypeResolver {
    constructor(
        @InjectRepository(LessonType)
        private readonly lessonTypesRepository: Repository<LessonType>,
    ) {}

    private isKrDefenseLessonType(value: string): boolean {
        return value.includes('защ') && value.includes('кр') && !value.includes('кп');
    }

    private isKpDefenseLessonType(value: string): boolean {
        return value.includes('защ') && value.includes('кп');
    }

    private mapRawToCode(raw: string): LessonTypeCode {
        const value = raw.trim().toLowerCase();

        if (value.startsWith('лек')) return LessonTypeCode.LECTURE;
        if (value.startsWith('практ')) return LessonTypeCode.PRACTICE;
        if (value.startsWith('лаб')) return LessonTypeCode.LAB;
        if (this.isKpDefenseLessonType(value)) return LessonTypeCode.KP_DEFENSE;
        if (this.isKrDefenseLessonType(value)) return LessonTypeCode.KR_DEFENSE;
        if (value.includes('зач')) return LessonTypeCode.CREDIT;
        if (value.includes('куратор') || value === 'особое' || value === 'особенное') {
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