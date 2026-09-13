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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const access_token_guard_1 = require("../auth/guards/access-token.guard");
const consultation_notification_preferences_service_1 = require("./consultation-notification-preferences.service");
const consultation_notification_preference_dto_1 = require("./dto/consultation-notification-preference.dto");
const push_subscription_dto_1 = require("./dto/push-subscription.dto");
const notifications_service_1 = require("./notifications.service");
const push_notifications_service_1 = require("./push-notifications.service");
const push_subscriptions_service_1 = require("./push-subscriptions.service");
let NotificationsController = class NotificationsController {
    notificationsService;
    pushNotificationsService;
    pushSubscriptionsService;
    consultationNotificationPreferencesService;
    constructor(notificationsService, pushNotificationsService, pushSubscriptionsService, consultationNotificationPreferencesService) {
        this.notificationsService = notificationsService;
        this.pushNotificationsService = pushNotificationsService;
        this.pushSubscriptionsService = pushSubscriptionsService;
        this.consultationNotificationPreferencesService = consultationNotificationPreferencesService;
    }
    list(request) {
        return this.notificationsService.listForUser(this.getUserId(request));
    }
    listConsultationTeacherOptions() {
        return this.consultationNotificationPreferencesService.listTeacherOptions();
    }
    getConsultationPreferences(request) {
        return this.consultationNotificationPreferencesService.getForUser(this.getUserId(request));
    }
    updateConsultationPreferences(request, dto) {
        return this.consultationNotificationPreferencesService.updateForUser(this.getUserId(request), dto);
    }
    getVapidPublicKey() {
        return {
            publicKey: this.pushNotificationsService.getPublicKey(),
            enabled: this.pushNotificationsService.isEnabled(),
        };
    }
    async getPushStatus(request, endpoint) {
        if (!endpoint?.trim()) {
            return { subscribed: false };
        }
        const subscribed = await this.pushSubscriptionsService.isSubscribed(this.getUserId(request), endpoint.trim());
        return { subscribed };
    }
    subscribe(request, dto) {
        return this.pushSubscriptionsService.subscribe(this.getUserId(request), dto);
    }
    unsubscribe(request, dto) {
        return this.pushSubscriptionsService.unsubscribe(this.getUserId(request), dto.endpoint);
    }
    markAllAsRead(request) {
        return this.notificationsService.markAllAsRead(this.getUserId(request));
    }
    markAsRead(request, id) {
        return this.notificationsService.markAsRead(this.getUserId(request), id);
    }
    getUserId(request) {
        return Number(request.user.sub ?? request.user.id);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('consultation-preferences/teachers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "listConsultationTeacherOptions", null);
__decorate([
    (0, common_1.Get)('consultation-preferences'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getConsultationPreferences", null);
__decorate([
    (0, common_1.Put)('consultation-preferences'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, consultation_notification_preference_dto_1.UpdateConsultationNotificationPreferenceDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "updateConsultationPreferences", null);
__decorate([
    (0, common_1.Get)('push/vapid-public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], NotificationsController.prototype, "getVapidPublicKey", null);
__decorate([
    (0, common_1.Get)('push/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('endpoint')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getPushStatus", null);
__decorate([
    (0, common_1.Post)('push/subscribe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_subscription_dto_1.PushSubscriptionDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Delete)('push/unsubscribe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_subscription_dto_1.UnsubscribePushDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "unsubscribe", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        push_notifications_service_1.PushNotificationsService,
        push_subscriptions_service_1.PushSubscriptionsService,
        consultation_notification_preferences_service_1.ConsultationNotificationPreferencesService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map