import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AccessTokenGuard } from './guards/access-token.guard';

interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        login: string;
        sid: number;
        refreshToken?: string;
    };
}

function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    // 5 попыток логина в минуту с одного IP
    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login(dto, getClientIp(req));
    }

    @UseGuards(AccessTokenGuard)
    @Get('me')
    me(@Req() req: AuthenticatedRequest) {
        return this.authService.getCurrentUser(req.user.sub);
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    refresh(@Req() req: AuthenticatedRequest) {
        return this.authService.refresh(req.user.sub, req.user.refreshToken!);
    }

    @UseGuards(AccessTokenGuard)
    @Get('logout')
    logout(@Req() req: AuthenticatedRequest) {
        return this.authService.logout(req.user.sub, req.user.sid);
    }

    @UseGuards(AccessTokenGuard)
    @Get('sessions')
    listSessions(@Req() req: AuthenticatedRequest) {
        return this.authService.listUserSessions(req.user.sub, req.user.sid);
    }

    @UseGuards(AccessTokenGuard)
    @Delete('sessions/:id')
    revokeSession(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.authService.revokeUserSession(
            req.user.sub,
            req.user.sid,
            id,
        );
    }

    @UseGuards(AccessTokenGuard)
    @Patch('password')
    changePassword(
        @Req() req: AuthenticatedRequest,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(
            req.user.sub,
            req.user.sid,
            dto,
        );
    }
}