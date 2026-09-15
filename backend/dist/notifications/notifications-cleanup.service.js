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
var NotificationsCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsCleanupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./notification.entity");
let NotificationsCleanupService = class NotificationsCleanupService {
    static { NotificationsCleanupService_1 = this; }
    notificationsRepository;
    static RETENTION_DAYS = 90;
    static CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
    logger = new common_1.Logger(NotificationsCleanupService_1.name);
    cleanupTimer = null;
    constructor(notificationsRepository) {
        this.notificationsRepository = notificationsRepository;
    }
    onModuleInit() {
        void this.cleanupExpiredNotifications();
        this.cleanupTimer = setInterval(() => {
            void this.cleanupExpiredNotifications();
        }, NotificationsCleanupService_1.CLEANUP_INTERVAL_MS);
    }
    onModuleDestroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
    async cleanupExpiredNotifications() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - NotificationsCleanupService_1.RETENTION_DAYS);
        const result = await this.notificationsRepository
            .createQueryBuilder()
            .delete()
            .where('"createdAt" < :cutoff', { cutoff })
            .execute();
        const deletedCount = result.affected ?? 0;
        if (deletedCount > 0) {
            this.logger.log(`Removed ${deletedCount} notifications older than ${NotificationsCleanupService_1.RETENTION_DAYS} days`);
        }
        return deletedCount;
    }
};
exports.NotificationsCleanupService = NotificationsCleanupService;
exports.NotificationsCleanupService = NotificationsCleanupService = NotificationsCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsCleanupService);
//# sourceMappingURL=notifications-cleanup.service.js.map