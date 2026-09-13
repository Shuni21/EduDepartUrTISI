import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { Notification } from './notification.entity';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    server: Server;
    constructor(jwtService: JwtService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    sendToUser(userId: number, notification: Notification): void;
    private getUserRoom;
    private getUserId;
}
