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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsNotifierService = void 0;
const common_1 = require("@nestjs/common");
const sessions_gateway_1 = require("./sessions.gateway");
const sessions_service_1 = require("./sessions.service");
let SessionsNotifierService = class SessionsNotifierService {
    sessionsService;
    sessionsGateway;
    constructor(sessionsService, sessionsGateway) {
        this.sessionsService = sessionsService;
        this.sessionsGateway = sessionsGateway;
    }
    async notifySessionsSync() {
        const sessions = await this.sessionsService.listActiveSessions();
        this.sessionsGateway.broadcastSessionsSync(sessions);
    }
    async notifySessionCreated(sessionId) {
        const session = await this.sessionsService.getSessionById(sessionId);
        if (!session) {
            return;
        }
        this.sessionsGateway.broadcastSessionCreated(session);
    }
    notifySessionRemoved(sessionId) {
        this.sessionsGateway.broadcastSessionRemoved({ id: sessionId });
    }
    async notifyUserSessionsRemoved(userId) {
        const sessionIds = await this.sessionsService.getActiveSessionIdsByUserId(userId);
        for (const sessionId of sessionIds) {
            this.notifySessionRemoved(sessionId);
        }
    }
};
exports.SessionsNotifierService = SessionsNotifierService;
exports.SessionsNotifierService = SessionsNotifierService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService,
        sessions_gateway_1.SessionsGateway])
], SessionsNotifierService);
//# sourceMappingURL=sessions-notifier.service.js.map