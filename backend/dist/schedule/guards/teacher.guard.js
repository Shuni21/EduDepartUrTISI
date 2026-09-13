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
exports.TeacherGuard = void 0;
const common_1 = require("@nestjs/common");
const role_entity_1 = require("../../users/entities/role.entity");
const users_service_1 = require("../../users/users.service");
let TeacherGuard = class TeacherGuard {
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
        if (user.role.code !== role_entity_1.RoleCode.TEACHER
            && user.role.code !== role_entity_1.RoleCode.EMPLOYEE) {
            throw new common_1.ForbiddenException('Недостаточно прав для управления консультациями');
        }
        return true;
    }
};
exports.TeacherGuard = TeacherGuard;
exports.TeacherGuard = TeacherGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], TeacherGuard);
//# sourceMappingURL=teacher.guard.js.map