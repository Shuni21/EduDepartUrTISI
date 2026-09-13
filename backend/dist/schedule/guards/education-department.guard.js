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
exports.EducationDepartmentGuard = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../../users/users.service");
const education_department_access_1 = require("../../users/education-department-access");
let EducationDepartmentGuard = class EducationDepartmentGuard {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const userId = request.user?.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException();
        }
        const user = await this.usersService.findByIdWithDetails(userId);
        if (!(0, education_department_access_1.canManageSchedule)(user)) {
            throw new common_1.ForbiddenException('Доступ только для сотрудников учебного отдела');
        }
        return true;
    }
};
exports.EducationDepartmentGuard = EducationDepartmentGuard;
exports.EducationDepartmentGuard = EducationDepartmentGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], EducationDepartmentGuard);
//# sourceMappingURL=education-department.guard.js.map