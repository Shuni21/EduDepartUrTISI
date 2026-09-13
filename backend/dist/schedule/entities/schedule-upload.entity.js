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
exports.ScheduleUpload = exports.ScheduleParseStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const schedule_type_enum_1 = require("./schedule-type.enum");
var ScheduleParseStatus;
(function (ScheduleParseStatus) {
    ScheduleParseStatus["SUCCESS"] = "success";
    ScheduleParseStatus["FAILED"] = "failed";
})(ScheduleParseStatus || (exports.ScheduleParseStatus = ScheduleParseStatus = {}));
let ScheduleUpload = class ScheduleUpload {
    id;
    scheduleType;
    originalFileName;
    storedFileName;
    fileUrl;
    mimeType;
    fileSize;
    groupName;
    facultyName;
    parseStatus;
    parseErrors;
    parseWarnings;
    lessonsCount;
    periodStart;
    periodEnd;
    uploadedById;
    uploadedBy;
    uploadedAt;
};
exports.ScheduleUpload = ScheduleUpload;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ScheduleUpload.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: schedule_type_enum_1.ScheduleType }),
    __metadata("design:type", String)
], ScheduleUpload.prototype, "scheduleType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleUpload.prototype, "originalFileName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleUpload.prototype, "storedFileName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleUpload.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleUpload.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ScheduleUpload.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ScheduleUpload.prototype, "groupName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ScheduleUpload.prototype, "facultyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ScheduleParseStatus, default: ScheduleParseStatus.SUCCESS }),
    __metadata("design:type", String)
], ScheduleUpload.prototype, "parseStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ScheduleUpload.prototype, "parseErrors", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ScheduleUpload.prototype, "parseWarnings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ScheduleUpload.prototype, "lessonsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ScheduleUpload.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ScheduleUpload.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ScheduleUpload.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'uploadedById' }),
    __metadata("design:type", user_entity_1.User)
], ScheduleUpload.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleUpload.prototype, "uploadedAt", void 0);
exports.ScheduleUpload = ScheduleUpload = __decorate([
    (0, typeorm_1.Entity)('schedule_uploads')
], ScheduleUpload);
//# sourceMappingURL=schedule-upload.entity.js.map