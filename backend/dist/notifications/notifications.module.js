"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const user_entity_1 = require("../users/entities/user.entity");
const consultation_notification_preference_entity_1 = require("./consultation-notification-preference.entity");
const consultation_notification_preferences_service_1 = require("./consultation-notification-preferences.service");
const consultation_notifications_service_1 = require("./consultation-notifications.service");
const notification_entity_1 = require("./notification.entity");
const notifications_controller_1 = require("./notifications.controller");
const notifications_cleanup_service_1 = require("./notifications-cleanup.service");
const notifications_gateway_1 = require("./notifications.gateway");
const notifications_service_1 = require("./notifications.service");
const push_notifications_service_1 = require("./push-notifications.service");
const push_subscription_entity_1 = require("./push-subscription.entity");
const push_subscriptions_service_1 = require("./push-subscriptions.service");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            jwt_1.JwtModule,
            typeorm_1.TypeOrmModule.forFeature([
                notification_entity_1.Notification,
                user_entity_1.User,
                push_subscription_entity_1.PushSubscription,
                consultation_notification_preference_entity_1.ConsultationNotificationPreference,
            ]),
        ],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [
            notifications_service_1.NotificationsService,
            notifications_gateway_1.NotificationsGateway,
            notifications_cleanup_service_1.NotificationsCleanupService,
            push_subscriptions_service_1.PushSubscriptionsService,
            push_notifications_service_1.PushNotificationsService,
            consultation_notification_preferences_service_1.ConsultationNotificationPreferencesService,
            consultation_notifications_service_1.ConsultationNotificationsService,
        ],
        exports: [notifications_service_1.NotificationsService, consultation_notifications_service_1.ConsultationNotificationsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map