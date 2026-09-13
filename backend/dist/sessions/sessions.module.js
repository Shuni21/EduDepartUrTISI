"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const users_module_1 = require("../users/users.module");
const refresh_token_entity_1 = require("../auth/entities/refresh-token.entity");
const sessions_gateway_1 = require("./sessions.gateway");
const sessions_service_1 = require("./sessions.service");
const sessions_notifier_service_1 = require("./sessions-notifier.service");
let SessionsModule = class SessionsModule {
};
exports.SessionsModule = SessionsModule;
exports.SessionsModule = SessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([refresh_token_entity_1.RefreshToken]),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_ACCESS_SECRET'),
                }),
            }),
        ],
        providers: [
            sessions_gateway_1.SessionsGateway,
            sessions_service_1.SessionsService,
            sessions_notifier_service_1.SessionsNotifierService,
        ],
        exports: [sessions_service_1.SessionsService, sessions_notifier_service_1.SessionsNotifierService],
    })
], SessionsModule);
//# sourceMappingURL=sessions.module.js.map