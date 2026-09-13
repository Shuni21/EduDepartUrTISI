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
exports.TeacherResolver = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const role_entity_1 = require("../../users/entities/role.entity");
let TeacherResolver = class TeacherResolver {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    parseTeacherName(raw) {
        const trimmed = raw.trim().replace(/\s+/g, ' ');
        const match = trimmed.match(/^([А-ЯЁ][а-яё-]+)\s+([А-ЯЁ])\.?\s*([А-ЯЁ])\.?\.?$/u);
        if (!match) {
            return null;
        }
        return {
            surname: match[1],
            nameInitial: match[2],
            patronymicInitial: match[3],
        };
    }
    buildQuery(parsed, teachersOnly) {
        const qb = this.usersRepository
            .createQueryBuilder('user')
            .where('user.surname ILIKE :surname', { surname: parsed.surname })
            .andWhere('LEFT(user.name, 1) ILIKE :nameInitial', {
            nameInitial: parsed.nameInitial,
        })
            .andWhere('LEFT(user.patronymic, 1) ILIKE :patronymicInitial', {
            patronymicInitial: parsed.patronymicInitial,
        });
        if (teachersOnly) {
            qb.innerJoin('user.role', 'role').andWhere('role.code = :role', {
                role: role_entity_1.RoleCode.TEACHER,
            });
        }
        return qb;
    }
    async resolve(rawTeacherName) {
        const parsed = this.parseTeacherName(rawTeacherName);
        if (!parsed) {
            return null;
        }
        let users = await this.buildQuery(parsed, true).getMany();
        if (users.length === 0) {
            users = await this.buildQuery(parsed, false).getMany();
        }
        if (users.length === 0) {
            return null;
        }
        return users[0];
    }
};
exports.TeacherResolver = TeacherResolver;
exports.TeacherResolver = TeacherResolver = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TeacherResolver);
//# sourceMappingURL=teacher.resolver.js.map