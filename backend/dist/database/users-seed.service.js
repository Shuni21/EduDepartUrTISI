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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersSeedService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const department_entity_1 = require("../academic/entities/department.entity");
const role_entity_1 = require("../users/entities/role.entity");
const staff_profile_entity_1 = require("../users/entities/staff-profile.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_seed_1 = require("./seeds/users.seed");
let UsersSeedService = UsersSeedService_1 = class UsersSeedService {
    configService;
    userRepository;
    roleRepository;
    staffProfileRepository;
    departmentRepository;
    logger = new common_1.Logger(UsersSeedService_1.name);
    constructor(configService, userRepository, roleRepository, staffProfileRepository, departmentRepository) {
        this.configService = configService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.departmentRepository = departmentRepository;
    }
    async onModuleInit() {
        for (const seedUser of users_seed_1.SEED_USERS) {
            await this.seedUser(seedUser);
        }
    }
    async seedUser(seedUser) {
        const password = this.configService.get(seedUser.envPasswordKey)?.trim();
        if (!password) {
            return;
        }
        if (password.length < 8) {
            this.logger.warn(`${seedUser.envPasswordKey} must be at least 8 characters; skipping ${seedUser.defaultLogin}`);
            return;
        }
        const login = (this.configService.get(seedUser.envLoginKey)?.trim()
            || seedUser.defaultLogin);
        const existing = await this.userRepository.findOne({
            where: { login },
        });
        if (existing) {
            this.logger.log(`Seed user "${login}" already exists`);
            return;
        }
        const role = await this.roleRepository.findOne({
            where: { code: seedUser.role },
        });
        if (!role) {
            this.logger.warn(`Role ${seedUser.role} is not ready; skipping ${login}`);
            return;
        }
        const department = await this.departmentRepository.findOne({
            where: { name: seedUser.departmentName },
        });
        if (!department) {
            this.logger.warn(`Department "${seedUser.departmentName}" is not ready; skipping ${login}`);
            return;
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.userRepository.save({
            login,
            passwordHash,
            roleId: role.id,
            surname: seedUser.surname,
            name: seedUser.name,
            patronymic: seedUser.patronymic,
            photoUrl: null,
            isActive: true,
        });
        await this.staffProfileRepository.save({
            userId: user.id,
            departmentId: department.id,
            position: seedUser.position,
            cabinet: null,
        });
        this.logger.log(`Created seed user "${login}" (${seedUser.role})`);
    }
};
exports.UsersSeedService = UsersSeedService;
exports.UsersSeedService = UsersSeedService = UsersSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(3, (0, typeorm_1.InjectRepository)(staff_profile_entity_1.StaffProfile)),
    __param(4, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersSeedService);
//# sourceMappingURL=users-seed.service.js.map