import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
declare const RefreshTokenStrategy_base: any;
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    private readonly configService;
    constructor(configService: ConfigService);
    validate(req: Request, payload: any): any;
}
export {};
