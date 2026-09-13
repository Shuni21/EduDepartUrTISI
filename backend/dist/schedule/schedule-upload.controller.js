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
exports.ScheduleUploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const access_token_guard_1 = require("../auth/guards/access-token.guard");
const education_department_guard_1 = require("./guards/education-department.guard");
const schedule_upload_service_1 = require("./schedule-upload.service");
let ScheduleUploadController = class ScheduleUploadController {
    scheduleUploadService;
    constructor(scheduleUploadService) {
        this.scheduleUploadService = scheduleUploadService;
    }
    listUploads() {
        return this.scheduleUploadService.listUploads();
    }
    previewSchedule(req, file) {
        return this.scheduleUploadService.previewSchedule(req.user.sub, req.body?.scheduleType, req.body?.groupName, req.body?.facultyName, file);
    }
    confirmSchedule(req, file) {
        let selectedIndexes = [];
        try {
            const raw = req.body?.selectedIndexes;
            selectedIndexes = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? []);
        }
        catch {
            selectedIndexes = [];
        }
        return this.scheduleUploadService.confirmSchedule(req.user.sub, req.body?.scheduleType, req.body?.groupName, req.body?.facultyName, file, selectedIndexes);
    }
    uploadSchedule(req, file) {
        return this.scheduleUploadService.uploadSchedule(req.user.sub, req.body?.scheduleType, req.body?.groupName, req.body?.facultyName, file);
    }
    deleteUpload(req, id) {
        return this.scheduleUploadService.deleteUpload(id, req.user.sub);
    }
};
exports.ScheduleUploadController = ScheduleUploadController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScheduleUploadController.prototype, "listUploads", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 20 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScheduleUploadController.prototype, "previewSchedule", null);
__decorate([
    (0, common_1.Post)('confirm'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 20 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScheduleUploadController.prototype, "confirmSchedule", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 20 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScheduleUploadController.prototype, "uploadSchedule", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], ScheduleUploadController.prototype, "deleteUpload", null);
exports.ScheduleUploadController = ScheduleUploadController = __decorate([
    (0, common_1.Controller)('education-department/schedules'),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard, education_department_guard_1.EducationDepartmentGuard),
    __metadata("design:paramtypes", [schedule_upload_service_1.ScheduleUploadService])
], ScheduleUploadController);
//# sourceMappingURL=schedule-upload.controller.js.map