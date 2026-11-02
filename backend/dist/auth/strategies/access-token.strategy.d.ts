import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
type AccessTokenPayload = {
    sub: number;
    login: string;
    sid?: number;
};
declare const AccessTokenStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class AccessTokenStrategy extends AccessTokenStrategy_base {
    private readonly configService;
    private readonly refreshTokenRepository;
    constructor(configService: ConfigService, refreshTokenRepository: Repository<RefreshToken>);
    validate(payload: AccessTokenPayload): Promise<AccessTokenPayload>;
}
export {};
