import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { SessionsNotifierService } from '../sessions/sessions-notifier.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserSessionResponse } from '../sessions/sessions.types';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly refreshTokenRepository;
    private readonly sessionsNotifier;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, refreshTokenRepository: Repository<RefreshToken>, sessionsNotifier: SessionsNotifierService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth-user.mapper").AuthUserResponse;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth-user.mapper").AuthUserResponse;
    }>;
    changePassword(userId: number, currentSessionId: number, dto: ChangePasswordDto): Promise<{
        success: boolean;
        loggedOutAllDevices: boolean;
    } | {
        success: boolean;
        loggedOutAllDevices: boolean;
        accessToken: string;
        refreshToken: string;
        user: import("./auth-user.mapper").AuthUserResponse;
    }>;
    listUserSessions(userId: number, currentSessionId: number): Promise<UserSessionResponse[]>;
    revokeUserSession(userId: number, currentSessionId: number, sessionId: number): Promise<{
        success: true;
        currentSessionRevoked: boolean;
    }>;
    getCurrentUser(userId: number): Promise<import("./auth-user.mapper").AuthUserResponse>;
    refresh(userId: number, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth-user.mapper").AuthUserResponse;
    }>;
    logout(userId: number, sessionId: number): Promise<{
        success: boolean;
    }>;
    private generateTokens;
    private createSessionTokens;
    private enforceSessionLimit;
    private revokeAllUserSessions;
    private cleanupOldSessions;
}
