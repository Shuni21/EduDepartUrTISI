import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { RefreshToken } from './entities/refresh-token.entity';
import { mapUserToAuthResponse } from './auth-user.mapper';
import { User } from '../users/entities/user.entity';
import { SessionsNotifierService } from '../sessions/sessions-notifier.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserSessionResponse } from '../sessions/sessions.types';

const MAX_ACTIVE_SESSIONS = 3;
type LoginAttempt = {
    count: number;
    blockedUntil?: number;
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_MS = 10 * 60_000; // 10 минут
@Injectable()
export class AuthService {

    private readonly loginAttempts = new Map<string, LoginAttempt>();

    private getLoginAttemptKey(login: string, ip: string): string {
        return `${login.trim().toLowerCase()}|${ip}`;
    }

    private assertLoginNotBlocked(login: string, ip: string): void {
        const key = this.getLoginAttemptKey(login, ip);
        const entry = this.loginAttempts.get(key);

        if (!entry?.blockedUntil) {
            return;
        }

        const now = Date.now();

        if (now < entry.blockedUntil) {
            const seconds = Math.ceil((entry.blockedUntil - now) / 1000);
            throw new UnauthorizedException(
                `Слишком много попыток входа. Повторите через ${seconds} сек.`,
            );
        }

        this.loginAttempts.delete(key);
    }

    private registerLoginFailure(login: string, ip: string): void {
        const key = this.getLoginAttemptKey(login, ip);
        const entry = this.loginAttempts.get(key) ?? { count: 0 };

        entry.count += 1;

        if (entry.count >= MAX_LOGIN_ATTEMPTS) {
            entry.blockedUntil = Date.now() + LOGIN_BLOCK_MS;
            entry.count = 0;
        }

        this.loginAttempts.set(key, entry);
    }

    private clearLoginAttempts(login: string, ip: string): void {
        this.loginAttempts.delete(this.getLoginAttemptKey(login, ip));
    }

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,

        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

        private readonly sessionsNotifier: SessionsNotifierService,
    ) {}

    async register(dto: RegisterDto) {
        const existingUser = await this.usersService.findByLogin(dto.login);

        if (existingUser) {
            throw new ConflictException(
                'Пользователь уже существует',
            );
        }

        const passwordHash = await bcrypt.hash(
            dto.password,
            10,
        );

        const user = await this.usersService.create({
            login: dto.login,
            passwordHash,
        });

        const userWithDetails =
            await this.usersService.findByIdWithDetails(
                user.id,
            );

        if (!userWithDetails) {
            throw new UnauthorizedException();
        }

        return this.generateTokens(userWithDetails);
    }

    async login(dto: LoginDto, ip: string) {
        this.assertLoginNotBlocked(dto.login, ip);

        const user = await this.usersService.findByLoginWithDetails(dto.login);

        if (!user) {
            this.registerLoginFailure(dto.login, ip);
            throw new UnauthorizedException('Неверный login или пароль');
        }

        const isPasswordValid = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            this.registerLoginFailure(dto.login, ip);
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        if (!user.isActive) {
            // не считаем как brute-force, аккаунт просто выключен
            throw new ForbiddenException('Учётная запись деактивирована');
        }

        this.clearLoginAttempts(dto.login, ip);

        return this.generateTokens(user);
    }

    async changePassword(
        userId: number,
        currentSessionId: number,
        dto: ChangePasswordDto,
    ) {
        const user = await this.usersService.findById(userId);

        const isCurrentValid = await bcrypt.compare(
            dto.currentPassword,
            user.passwordHash,
        );

        if (!isCurrentValid) {
            throw new UnauthorizedException('Неверный текущий пароль');
        }

        const isSamePassword = await bcrypt.compare(
            dto.newPassword,
            user.passwordHash,
        );

        if (isSamePassword) {
            throw new BadRequestException(
                'Новый пароль должен отличаться от текущего',
            );
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 10);

        await this.usersService.update(userId, { passwordHash });

        const userWithDetails =
            await this.usersService.findByIdWithDetails(userId);

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
            await this.refreshTokenRepository.update(
                { id: currentSessionId },
                { isActive: false },
            );

            this.sessionsNotifier.notifySessionRemoved(
                currentSessionId,
            );
        }

        const tokens = await this.createSessionTokens(userWithDetails);

        return {
            ...tokens,
            success: true,
            loggedOutAllDevices: false,
        };
    }

    async listUserSessions(
        userId: number,
        currentSessionId: number,
    ): Promise<UserSessionResponse[]> {
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

    async revokeUserSession(
        userId: number,
        currentSessionId: number,
        sessionId: number,
    ): Promise<{ success: true; currentSessionRevoked: boolean }> {
        const session = await this.refreshTokenRepository.findOne({
            where: {
                id: sessionId,
                userId,
                isActive: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Активная сессия не найдена');
        }

        await this.refreshTokenRepository.update(
            { id: sessionId },
            { isActive: false },
        );

        this.sessionsNotifier.notifySessionRemoved(sessionId);

        return {
            success: true,
            currentSessionRevoked: sessionId === currentSessionId,
        };
    }

    async getCurrentUser(userId: number) {
        const user =
            await this.usersService.findByIdWithDetails(
                userId,
            );

        if (!user) {
            throw new UnauthorizedException();
        }

        if (!user.isActive) {
            throw new ForbiddenException(
                'Учётная запись деактивирована',
            );
        }

        return mapUserToAuthResponse(user);
    }

    async refresh(
        userId: number,
        refreshToken: string,
    ) {
        const activeSessions =
            await this.refreshTokenRepository.find({
                where: {
                    userId,
                    isActive: true,
                },
            });

        let matchedSession: RefreshToken | null = null;

        for (const session of activeSessions) {
            const isValid = await bcrypt.compare(
                refreshToken,
                session.tokenHash,
            );

            if (isValid) {
                matchedSession = session;
                break;
            }
        }

        if (!matchedSession) {
            throw new UnauthorizedException();
        }

        const user =
            await this.usersService.findByIdWithDetails(
                userId,
            );

        if (!user) {
            throw new UnauthorizedException();
        }

        if (!user.isActive) {
            throw new ForbiddenException(
                'Учётная запись деактивирована',
            );
        }

        await this.refreshTokenRepository.update(
            { id: matchedSession.id },
            { isActive: false },
        );

        this.sessionsNotifier.notifySessionRemoved(
            matchedSession.id,
        );

        return this.createSessionTokens(user);
    }

    async logout(userId: number, sessionId: number) {
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

        await this.refreshTokenRepository.update(
            { id: sessionId },
            { isActive: false },
        );

        this.sessionsNotifier.notifySessionRemoved(sessionId);

        return {
            success: true,
        };
    }

    private async generateTokens(
        user: User,
        options: { revokeAllSessions?: boolean } = {},
    ) {
        if (!user.isActive) {
            throw new ForbiddenException(
                'Учётная запись деактивирована',
            );
        }

        await this.cleanupOldSessions(user.id);

        if (options.revokeAllSessions) {
            await this.revokeAllUserSessions(user.id);
        } else {
            await this.enforceSessionLimit(
                user.id,
                MAX_ACTIVE_SESSIONS - 1,
            );
        }

        return this.createSessionTokens(user);
    }

    private async createSessionTokens(user: User) {
        const payload = {
            sub: user.id,
            login: user.login,
        };

        const refreshToken =
            await this.jwtService.signAsync(
                payload,
                {
                    secret:
                        this.configService.getOrThrow<string>(
                            'JWT_REFRESH_SECRET',
                        ),
                    expiresIn: '30d',
                },
            );

        const tokenHash = await bcrypt.hash(
            refreshToken,
            10,
        );

        const session =
            await this.refreshTokenRepository.save({
                userId: user.id,
                tokenHash,
                isActive: true,
            });

        await this.sessionsNotifier.notifySessionCreated(
            session.id,
        );

        const accessToken =
            await this.jwtService.signAsync(
                {
                    ...payload,
                    sid: session.id,
                },
                {
                    secret:
                        this.configService.getOrThrow<string>(
                            'JWT_ACCESS_SECRET',
                        ),
                    expiresIn: '15m',
                },
            );

        return {
            accessToken,
            refreshToken,
            user: mapUserToAuthResponse(user),
        };
    }

    private async enforceSessionLimit(
        userId: number,
        maxSessions: number,
    ): Promise<void> {
        const activeSessions =
            await this.refreshTokenRepository.find({
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
            await this.refreshTokenRepository.update(
                { id: session.id },
                { isActive: false },
            );

            this.sessionsNotifier.notifySessionRemoved(
                session.id,
            );
        }
    }

    private async revokeAllUserSessions(
        userId: number,
    ): Promise<void> {
        await this.sessionsNotifier.notifyUserSessionsRemoved(
            userId,
        );

        await this.refreshTokenRepository.update(
            {
                userId,
                isActive: true,
            },
            {
                isActive: false,
            },
        );
    }

    private async cleanupOldSessions(
        userId: number,
    ): Promise<void> {
        const cutoff = new Date();

        cutoff.setDate(
            cutoff.getDate() - 90,
        );

        await this.refreshTokenRepository
            .createQueryBuilder()
            .delete()
            .where('userId = :userId', {
                userId,
            })
            .andWhere('isActive = false')
            .andWhere(
                'createdAt < :cutoff',
                {
                    cutoff,
                },
            )
            .execute();
    }
}