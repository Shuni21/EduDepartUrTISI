import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { SessionsService } from './sessions.service';
import { AdminSessionResponse, SessionRemovedPayload } from './sessions.types';
export declare class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly usersService;
    private readonly sessionsService;
    private readonly logger;
    server: Server;
    constructor(jwtService: JwtService, configService: ConfigService, usersService: UsersService, sessionsService: SessionsService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    broadcastSessionsSync(sessions: AdminSessionResponse[]): void;
    broadcastSessionCreated(session: AdminSessionResponse): void;
    broadcastSessionRemoved(payload: SessionRemovedPayload): void;
    private authenticateAdmin;
}
