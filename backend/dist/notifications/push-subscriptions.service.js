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
exports.PushSubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const push_subscription_entity_1 = require("./push-subscription.entity");
let PushSubscriptionsService = class PushSubscriptionsService {
    pushSubscriptionsRepository;
    constructor(pushSubscriptionsRepository) {
        this.pushSubscriptionsRepository = pushSubscriptionsRepository;
    }
    findByUserId(userId) {
        return this.pushSubscriptionsRepository.find({
            where: { userId },
        });
    }
    findByUserAndEndpoint(userId, endpoint) {
        return this.pushSubscriptionsRepository.findOne({
            where: { userId, endpoint },
        });
    }
    async subscribe(userId, dto) {
        const existing = await this.pushSubscriptionsRepository.findOne({
            where: { endpoint: dto.endpoint },
        });
        if (existing) {
            existing.userId = userId;
            existing.p256dh = dto.p256dh;
            existing.auth = dto.auth;
            await this.pushSubscriptionsRepository.save(existing);
            return;
        }
        await this.pushSubscriptionsRepository.save(this.pushSubscriptionsRepository.create({
            userId,
            endpoint: dto.endpoint,
            p256dh: dto.p256dh,
            auth: dto.auth,
        }));
    }
    async unsubscribe(userId, endpoint) {
        await this.pushSubscriptionsRepository.delete({ userId, endpoint });
    }
    async isSubscribed(userId, endpoint) {
        const subscription = await this.findByUserAndEndpoint(userId, endpoint);
        return Boolean(subscription);
    }
    async removeById(id) {
        await this.pushSubscriptionsRepository.delete({ id });
    }
    async removeAllForUser(userId) {
        await this.pushSubscriptionsRepository.delete({ userId });
    }
};
exports.PushSubscriptionsService = PushSubscriptionsService;
exports.PushSubscriptionsService = PushSubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(push_subscription_entity_1.PushSubscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PushSubscriptionsService);
//# sourceMappingURL=push-subscriptions.service.js.map