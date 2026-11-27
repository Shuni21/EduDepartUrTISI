"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonTypeResolver = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lesson_type_entity_1 = require("../entities/lesson-type.entity");
const lesson_type_utils_1 = require("../parser/lesson-type.utils");
let LessonTypeResolver = class LessonTypeResolver {
    lessonTypesRepository;
    constructor(lessonTypesRepository) {
        this.lessonTypesRepository = lessonTypesRepository;
    }
    mapRawToCode(raw) {
        const compact = (0, lesson_type_utils_1.compactLessonType)(raw);
        if (compact.startsWith('лек'))
            return lesson_type_entity_1.LessonTypeCode.LECTURE;
        if (compact.startsWith('практ'))
            return lesson_type_entity_1.LessonTypeCode.PRACTICE;
        if (compact.startsWith('лаб'))
            return lesson_type_entity_1.LessonTypeCode.LAB;
        if ((0, lesson_type_utils_1.isKpDefenseLessonType)(raw))
            return lesson_type_entity_1.LessonTypeCode.KP_DEFENSE;
        if ((0, lesson_type_utils_1.isKrDefenseLessonType)(raw))
            return lesson_type_entity_1.LessonTypeCode.KR_DEFENSE;
        if ((0, lesson_type_utils_1.isCreditLessonType)(raw))
            return lesson_type_entity_1.LessonTypeCode.CREDIT;
        if (compact.includes('куратор') || compact === 'особое' || compact === 'особенное') {
            return lesson_type_entity_1.LessonTypeCode.SPECIAL;
        }
        return lesson_type_entity_1.LessonTypeCode.PRACTICE;
    }
    mapCodeToName(code, raw) {
        if (raw.toLowerCase().includes('куратор') || raw.toLowerCase() === 'особое') {
            return 'Особое';
        }
        switch (code) {
            case lesson_type_entity_1.LessonTypeCode.LECTURE: return 'Лекция';
            case lesson_type_entity_1.LessonTypeCode.PRACTICE: return 'Практика';
            case lesson_type_entity_1.LessonTypeCode.LAB: return 'Лаб. раб.';
            case lesson_type_entity_1.LessonTypeCode.CREDIT: return 'Зачёт';
            case lesson_type_entity_1.LessonTypeCode.KR_DEFENSE: return 'Защита КР';
            case lesson_type_entity_1.LessonTypeCode.KP_DEFENSE: return 'Защита КП';
            case lesson_type_entity_1.LessonTypeCode.SPECIAL: return 'Особое';
            default: return raw.trim();
        }
    }
    async resolve(rawLessonType) {
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
            lessonType = await this.lessonTypesRepository.save(this.lessonTypesRepository.create({ code, name }));
        }
        return lessonType;
    }
};
exports.LessonTypeResolver = LessonTypeResolver;
exports.LessonTypeResolver = LessonTypeResolver = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lesson_type_entity_1.LessonType)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LessonTypeResolver);
//# sourceMappingURL=lesson-type.resolver.js.map