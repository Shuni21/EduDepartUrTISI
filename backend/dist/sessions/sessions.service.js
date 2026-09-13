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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const refresh_token_entity_1 = require("../auth/entities/refresh-token.entity");
let SessionsService = class SessionsService {
    refreshTokenRepository;
    constructor(refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }
    async listActiveSessions() {
        const sessions = await this.refreshTokenRepository.find({
            where: { isActive: true },
            relations: ['user', 'user.role'],
            order: { createdAt: 'DESC' },
        });
        return sessions.map((session) => this.mapSession(session));
    }
    async getSessionById(id) {
        const session = await this.refreshTokenRepository.findOne({
            where: { id, isActive: true },
            relations: ['user', 'user.role'],
        });
        if (!session) {
            return null;
        }
        return this.mapSession(session);
    }
    async getActiveSessionIdsByUserId(userId) {
        const sessions = await this.refreshTokenRepository.find({
            where: { userId, isActive: true },
            select: ['id'],
        });
        return sessions.map((session) => session.id);
    }
    mapSession(session) {
        return {
            id: session.id,
            userId: session.userId,
            login: session.user.login,
            fullName: this.formatFullName(session.user),
            role: session.user.role.code,
            createdAt: session.createdAt,
        };
    }
    formatFullName(user) {
        const patronymicInitial = user.patronymic
            ? ` ${user.patronymic.charAt(0)}.`
            : '';
        return `${user.surname} ${user.name.charAt(0)}.${patronymicInitial}`.trim();
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map