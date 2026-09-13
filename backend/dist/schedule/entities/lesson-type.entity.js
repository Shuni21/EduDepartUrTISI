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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonType = exports.LessonTypeCode = void 0;
const typeorm_1 = require("typeorm");
const schedule_item_entity_1 = require("./schedule-item.entity");
var LessonTypeCode;
(function (LessonTypeCode) {
    LessonTypeCode["LECTURE"] = "lecture";
    LessonTypeCode["PRACTICE"] = "practice";
    LessonTypeCode["LAB"] = "lab";
    LessonTypeCode["CREDIT"] = "credit";
    LessonTypeCode["KR_DEFENSE"] = "kr_defense";
    LessonTypeCode["SPECIAL"] = "special";
})(LessonTypeCode || (exports.LessonTypeCode = LessonTypeCode = {}));
let LessonType = class LessonType {
    id;
    code;
    name;
    scheduleItems;
};
exports.LessonType = LessonType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LessonType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LessonTypeCode, unique: true }),
    __metadata("design:type", String)
], LessonType.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => schedule_item_entity_1.ScheduleItem, (item) => item.lessonType),
    __metadata("design:type", Array)
], LessonType.prototype, "scheduleItems", void 0);
exports.LessonType = LessonType = __decorate([
    (0, typeorm_1.Entity)('lesson_types')
], LessonType);
//# sourceMappingURL=lesson-type.entity.js.map