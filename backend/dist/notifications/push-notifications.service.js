"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PushNotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const webpush = __importStar(require("web-push"));
const push_subscriptions_service_1 = require("./push-subscriptions.service");
let PushNotificationsService = PushNotificationsService_1 = class PushNotificationsService {
    configService;
    pushSubscriptionsService;
    logger = new common_1.Logger(PushNotificationsService_1.name);
    enabled = false;
    constructor(configService, pushSubscriptionsService) {
        this.configService = configService;
        this.pushSubscriptionsService = pushSubscriptionsService;
    }
    onModuleInit() {
        const publicKey = this.configService.get('VAPID_PUBLIC_KEY');
        const privateKey = this.configService.get('VAPID_PRIVATE_KEY');
        const subject = this.configService.get('VAPID_SUBJECT') ?? 'mailto:admin@urtisi.ru';
        if (!publicKey || !privateKey) {
            this.logger.warn('VAPID keys are not configured. Push notifications are disabled.');
            return;
        }
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.enabled = true;
    }
    getPublicKey() {
        return this.configService.get('VAPID_PUBLIC_KEY') ?? null;
    }
    isEnabled() {
        return this.enabled;
    }
    async sendToUser(userId, notification) {
        if (!this.enabled) {
            return;
        }
        const subscriptions = await this.pushSubscriptionsService.findByUserId(userId);
        if (subscriptions.length === 0) {
            return;
        }
        const payload = JSON.stringify({
            title: notification.title,
            body: notification.message,
            data: {
                notificationId: notification.id,
                ...(notification.payload ?? {}),
                url: `/notifications?id=${notification.id}`,
            },
        });
        await Promise.all(subscriptions.map((subscription) => this.sendToSubscription(subscription, payload)));
    }
    async sendToSubscription(subscription, payload) {
        try {
            await webpush.sendNotification({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                },
            }, payload);
        }
        catch (error) {
            const statusCode = this.getStatusCode(error);
            if (statusCode === 404 || statusCode === 410) {
                await this.pushSubscriptionsService.removeById(subscription.id);
                return;
            }
            this.logger.warn(`Failed to send push notification to subscription ${subscription.id}: ${this.getErrorMessage(error)}`);
        }
    }
    getStatusCode(error) {
        if (typeof error === 'object'
            && error !== null
            && 'statusCode' in error
            && typeof error.statusCode === 'number') {
            return error.statusCode;
        }
        return null;
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return 'Unknown error';
    }
};
exports.PushNotificationsService = PushNotificationsService;
exports.PushNotificationsService = PushNotificationsService = PushNotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        push_subscriptions_service_1.PushSubscriptionsService])
], PushNotificationsService);
//# sourceMappingURL=push-notifications.service.js.map