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
exports.ScheduleAdminController = void 0;
const common_1 = require("@nestjs/common");
const access_token_guard_1 = require("../auth/guards/access-token.guard");
const schedule_item_dto_1 = require("./dto/schedule-item.dto");
const education_department_guard_1 = require("./guards/education-department.guard");
const schedule_admin_service_1 = require("./schedule-admin.service");
let ScheduleAdminController = class ScheduleAdminController {
    scheduleAdminService;
    constructor(scheduleAdminService) {
        this.scheduleAdminService = scheduleAdminService;
    }
    createItem(dto) {
        return this.scheduleAdminService.createItem(dto);
    }
    getTransferRecommendations(id, query) {
        return this.scheduleAdminService.getTransferRecommendations(id, query.weekStart);
    }
    previewItemChanges(id, dto) {
        return this.scheduleAdminService.previewItemChanges(id, dto);
    }
    getLinkedGroupNames(id) {
        return this.scheduleAdminService.getLinkedGroupNames(id);
    }
    updateItem(id, dto) {
        return this.scheduleAdminService.updateItem(id, dto);
    }
    disableItem(id) {
        return this.scheduleAdminService.disableItem(id);
    }
    deleteItem(id) {
        return this.scheduleAdminService.deleteItem(id);
    }
};
exports.ScheduleAdminController = ScheduleAdminController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_item_dto_1.CreateScheduleItemDto]),
    __metadata("design:returntype", Promise)
], ScheduleAdminController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)(':id/recommendations'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, schedule_item_dto_1.ScheduleTransferRecommendationQueryDto]),
    __metadata("design:returntype", Promise)
], ScheduleAdminController.prototype, "getTransferRecommendations", null);
__decorate([
    (0, common_1.Post)(':id/preview'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, schedule_item_dto_1.ScheduleItemPreviewDto]),
    __metadata("design:returntype", Promise)
], ScheduleAdminController.prototype, "previewItemChanges", null);
__decorate([
    (0, common_1.Get)(':id/linked-groups'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScheduleAdminController.prototype, "getLinkedGroupNames", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, schedule_item_dto_1.UpdateScheduleItemDto]),
    __metadata("design:returntype", Promise)
], ScheduleAdminController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Patch)(':id/disable'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScheduleAdminController.prototype, "disableItem", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScheduleAdminController.prototype, "deleteItem", null);
exports.ScheduleAdminController = ScheduleAdminController = __decorate([
    (0, common_1.Controller)('education-department/schedules/items'),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard, education_department_guard_1.EducationDepartmentGuard),
    __metadata("design:paramtypes", [schedule_admin_service_1.ScheduleAdminService])
], ScheduleAdminController);
//# sourceMappingURL=schedule-admin.controller.js.map