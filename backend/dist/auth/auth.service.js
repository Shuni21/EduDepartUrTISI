"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const auth_user_mapper_1 = require("./auth-user.mapper");
const sessions_notifier_service_1 = require("../sessions/sessions-notifier.service");
const MAX_ACTIVE_SESSIONS = 3;
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    refreshTokenRepository;
    sessionsNotifier;
    constructor(usersService, jwtService, configService, refreshTokenRepository, sessionsNotifier) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.sessionsNotifier = sessionsNotifier;
    }
    async register(dto) {
        const existingUser = await this.usersService.findByLogin(dto.login);
        if (existingUser) {
            throw new common_1.ConflictException('Пользователь уже существует');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            login: dto.login,
            passwordHash,
        });
        const userWithDetails = await this.usersService.findByIdWithDetails(user.id);
        if (!userWithDetails) {
            throw new common_1.UnauthorizedException();
        }
        return this.generateTokens(userWithDetails);
    }
    async login(dto) {
        const user = await this.usersService.findByLoginWithDetails(dto.login);
        if (!user) {
            throw new common_1.UnauthorizedException('Неверный login или пароль');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Неверный login или пароль');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Учётная запись деактивирована');
        }
        return this.generateTokens(user);
    }
    async changePassword(userId, currentSessionId, dto) {
        const user = await this.usersService.findById(userId);
        const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentValid) {
            throw new common_1.UnauthorizedException('Неверный текущий пароль');
        }
        const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw new common_1.BadRequestException('Новый пароль должен отличаться от текущего');
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.usersService.update(userId, { passwordHash });
        const userWithDetails = await this.usersService.findByIdWithDetails(userId);
        if (dto.logoutAllDevices) {
            await this.revokeAllUserSessions(userId);
            return {
                success: true,
                loggedOutAllDevices: true,
            };
        }
        const currentSession = await this.refreshTokenRepository.findOne({
            where: {
                id: currentSessionId,
                userId,
                isActive: true,
            },
        });
        if (currentSession) {
            await this.refreshTokenRepository.update({ id: currentSessionId }, { isActive: false });
            this.sessionsNotifier.notifySessionRemoved(currentSessionId);
        }
        const tokens = await this.createSessionTokens(userWithDetails);
        return {
            ...tokens,
            success: true,
            loggedOutAllDevices: false,
        };
    }
    async listUserSessions(userId, currentSessionId) {
        const sessions = await this.refreshTokenRepository.find({
            where: {
                userId,
                isActive: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
        return sessions.map((session) => ({
            id: session.id,
            createdAt: session.createdAt,
            isCurrent: session.id === currentSessionId,
        }));
    }
    async revokeUserSession(userId, currentSessionId, sessionId) {
        const session = await this.refreshTokenRepository.findOne({
            where: {
                id: sessionId,
                userId,
                isActive: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Активная сессия не найдена');
        }
        await this.refreshTokenRepository.update({ id: sessionId }, { isActive: false });
        this.sessionsNotifier.notifySessionRemoved(sessionId);
        return {
            success: true,
            currentSessionRevoked: sessionId === currentSessionId,
        };
    }
    async getCurrentUser(userId) {
        const user = await this.usersService.findByIdWithDetails(userId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Учётная запись деактивирована');
        }
        return (0, auth_user_mapper_1.mapUserToAuthResponse)(user);
    }
    async refresh(userId, refreshToken) {
        const activeSessions = await this.refreshTokenRepository.find({
            where: {
                userId,
                isActive: true,
            },
        });
        let matchedSession = null;
        for (const session of activeSessions) {
            const isValid = await bcrypt.compare(refreshToken, session.tokenHash);
            if (isValid) {
                matchedSession = session;
                break;
            }
        }
        if (!matchedSession) {
            throw new common_1.UnauthorizedException();
        }
        const user = await this.usersService.findByIdWithDetails(userId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Учётная запись деактивирована');
        }
        await this.refreshTokenRepository.update({ id: matchedSession.id }, { isActive: false });
        this.sessionsNotifier.notifySessionRemoved(matchedSession.id);
        return this.createSessionTokens(user);
    }
    async logout(userId, sessionId) {
        const session = await this.refreshTokenRepository.findOne({
            where: {
                id: sessionId,
                userId,
                isActive: true,
            },
        });
        if (!session) {
            return {
                success: true,
            };
        }
        await this.refreshTokenRepository.update({ id: sessionId }, { isActive: false });
        this.sessionsNotifier.notifySessionRemoved(sessionId);
        return {
            success: true,
        };
    }
    async generateTokens(user, options = {}) {
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Учётная запись деактивирована');
        }
        await this.cleanupOldSessions(user.id);
        if (options.revokeAllSessions) {
            await this.revokeAllUserSessions(user.id);
        }
        else {
            await this.enforceSessionLimit(user.id, MAX_ACTIVE_SESSIONS - 1);
        }
        return this.createSessionTokens(user);
    }
    async createSessionTokens(user) {
        const payload = {
            sub: user.id,
            login: user.login,
        };
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: '30d',
        });
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        const session = await this.refreshTokenRepository.save({
            userId: user.id,
            tokenHash,
            isActive: true,
        });
        await this.sessionsNotifier.notifySessionCreated(session.id);
        const accessToken = await this.jwtService.signAsync({
            ...payload,
            sid: session.id,
        }, {
            secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            expiresIn: '15m',
        });
        return {
            accessToken,
            refreshToken,
            user: (0, auth_user_mapper_1.mapUserToAuthResponse)(user),
        };
    }
    async enforceSessionLimit(userId, maxSessions) {
        const activeSessions = await this.refreshTokenRepository.find({
            where: {
                userId,
                isActive: true,
            },
            order: {
                createdAt: 'ASC',
            },
        });
        const excess = activeSessions.length - maxSessions;
        if (excess <= 0) {
            return;
        }
        const sessionsToRemove = activeSessions.slice(0, excess);
        for (const session of sessionsToRemove) {
            await this.refreshTokenRepository.update({ id: session.id }, { isActive: false });
            this.sessionsNotifier.notifySessionRemoved(session.id);
        }
    }
    async revokeAllUserSessions(userId) {
        await this.sessionsNotifier.notifyUserSessionsRemoved(userId);
        await this.refreshTokenRepository.update({
            userId,
            isActive: true,
        }, {
            isActive: false,
        });
    }
    async cleanupOldSessions(userId) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        await this.refreshTokenRepository
            .createQueryBuilder()
            .delete()
            .where('userId = :userId', {
            userId,
        })
            .andWhere('isActive = false')
            .andWhere('createdAt < :cutoff', {
            cutoff,
        })
            .execute();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository,
        sessions_notifier_service_1.SessionsNotifierService])
], AuthService);
//# sourceMappingURL=auth.service.js.map