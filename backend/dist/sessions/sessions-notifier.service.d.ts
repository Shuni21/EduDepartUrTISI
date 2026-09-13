import { SessionsGateway } from './sessions.gateway';
import { SessionsService } from './sessions.service';
export declare class SessionsNotifierService {
    private readonly sessionsService;
    private readonly sessionsGateway;
    constructor(sessionsService: SessionsService, sessionsGateway: SessionsGateway);
    notifySessionsSync(): Promise<void>;
    notifySessionCreated(sessionId: number): Promise<void>;
    notifySessionRemoved(sessionId: number): void;
    notifyUserSessionsRemoved(userId: number): Promise<void>;
}
