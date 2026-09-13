"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const socket_io_1 = require("socket.io");
const network_1 = require("../config/network");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    jwtService;
    configService;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    server;
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async handleConnection(client) {
        const userId = await this.getUserId(client);
        if (!userId) {
            client.disconnect();
            return;
        }
        await client.join(this.getUserRoom(userId));
        this.logger.debug(`Notifications websocket connected ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`Notifications websocket disconnected ${client.id}`);
    }
    sendToUser(userId, notification) {
        this.server?.to(this.getUserRoom(userId)).emit('notification:created', notification);
    }
    getUserRoom(userId) {
        return `user:${userId}`;
    }
    async getUserId(client) {
        try {
            const authToken = client.handshake.auth?.token;
            const headerToken = client.handshake.headers.authorization
                ?.replace(/^Bearer\s+/i, '');
            const token = typeof authToken === 'string' ? authToken : headerToken;
            if (!token) {
                return null;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            });
            return payload.sub;
        }
        catch {
            return null;
        }
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleDisconnect", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: '/notifications/live',
        cors: {
            origin: (origin, callback) => {
                if ((0, network_1.isAllowedCorsOrigin)(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error('Not allowed by CORS'), false);
            },
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map