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
var SessionsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const socket_io_1 = require("socket.io");
const users_service_1 = require("../users/users.service");
const role_entity_1 = require("../users/entities/role.entity");
const network_1 = require("../config/network");
const sessions_service_1 = require("./sessions.service");
let SessionsGateway = SessionsGateway_1 = class SessionsGateway {
    jwtService;
    configService;
    usersService;
    sessionsService;
    logger = new common_1.Logger(SessionsGateway_1.name);
    server;
    constructor(jwtService, configService, usersService, sessionsService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.usersService = usersService;
        this.sessionsService = sessionsService;
    }
    async handleConnection(client) {
        const isAdmin = await this.authenticateAdmin(client);
        if (!isAdmin) {
            this.logger.warn(`Rejected websocket connection ${client.id}`);
            client.disconnect();
            return;
        }
        const sessions = await this.sessionsService.listActiveSessions();
        client.emit('sessions:sync', sessions);
    }
    handleDisconnect(client) {
        this.logger.debug(`Websocket disconnected ${client.id}`);
    }
    broadcastSessionsSync(sessions) {
        this.server?.emit('sessions:sync', sessions);
    }
    broadcastSessionCreated(session) {
        this.server?.emit('session:created', session);
    }
    broadcastSessionRemoved(payload) {
        this.server?.emit('session:removed', payload);
    }
    async authenticateAdmin(client) {
        try {
            const authToken = client.handshake.auth?.token;
            const headerToken = client.handshake.headers.authorization
                ?.replace(/^Bearer\s+/i, '');
            const token = typeof authToken === 'string'
                ? authToken
                : headerToken;
            if (!token) {
                return false;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            });
            const user = await this.usersService.findByIdWithDetails(payload.sub);
            return user.role.code === role_entity_1.RoleCode.ADMIN && user.isActive;
        }
        catch {
            return false;
        }
    }
};
exports.SessionsGateway = SessionsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SessionsGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SessionsGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SessionsGateway.prototype, "handleDisconnect", null);
exports.SessionsGateway = SessionsGateway = SessionsGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: '/admin/sessions',
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
        config_1.ConfigService,
        users_service_1.UsersService,
        sessions_service_1.SessionsService])
], SessionsGateway);
//# sourceMappingURL=sessions.gateway.js.map