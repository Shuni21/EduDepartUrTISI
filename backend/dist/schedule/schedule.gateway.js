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
var ScheduleGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const network_1 = require("../config/network");
let ScheduleGateway = ScheduleGateway_1 = class ScheduleGateway {
    logger = new common_1.Logger(ScheduleGateway_1.name);
    server;
    handleConnection(client) {
        this.logger.debug(`Schedule a websocket connected ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`Schedule a websocket disconnected ${client.id}`);
    }
    broadcastScheduleChanged(payload) {
        this.server?.emit(`schedule:changed`, payload);
    }
    broadcastPreholidayDaysUpdated(preholidayDays) {
        this.server?.emit('schedule:preholiday-days-updated', {
            preholidayDays,
        });
    }
};
exports.ScheduleGateway = ScheduleGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ScheduleGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ScheduleGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ScheduleGateway.prototype, "handleDisconnect", null);
exports.ScheduleGateway = ScheduleGateway = ScheduleGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: `/schedules/live`,
        cors: {
            origin: (origin, callback) => {
                if (!origin || (0, network_1.isAllowedCorsOrigin)(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error(`Not allowed by CORS`), false);
            },
            credentials: true
        },
    })
], ScheduleGateway);
//# sourceMappingURL=schedule.gateway.js.map