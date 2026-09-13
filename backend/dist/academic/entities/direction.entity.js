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
exports.Direction = void 0;
const typeorm_1 = require("typeorm");
const group_entity_1 = require("./group.entity");
let Direction = class Direction {
    id;
    code;
    name;
    groups;
};
exports.Direction = Direction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Direction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Direction.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Direction.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => group_entity_1.Group, (group) => group.direction),
    __metadata("design:type", Array)
], Direction.prototype, "groups", void 0);
exports.Direction = Direction = __decorate([
    (0, typeorm_1.Entity)('directions')
], Direction);
//# sourceMappingURL=direction.entity.js.map