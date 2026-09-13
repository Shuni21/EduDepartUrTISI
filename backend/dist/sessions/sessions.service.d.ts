import { Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { AdminSessionResponse } from './sessions.types';
export declare class SessionsService {
    private readonly refreshTokenRepository;
    constructor(refreshTokenRepository: Repository<RefreshToken>);
    listActiveSessions(): Promise<AdminSessionResponse[]>;
    getSessionById(id: number): Promise<AdminSessionResponse | null>;
    getActiveSessionIdsByUserId(userId: number): Promise<number[]>;
    private mapSession;
    private formatFullName;
}
