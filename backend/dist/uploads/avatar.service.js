"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const sharp_1 = __importDefault(require("sharp"));
const storage_1 = require("../config/storage");
const AVATAR_SIZE = 512;
const WEBP_QUALITY = 82;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
]);
let AvatarService = class AvatarService {
    avatarsDir = (0, storage_1.getAvatarsDir)();
    async onModuleInit() {
        await (0, promises_1.mkdir)(this.avatarsDir, { recursive: true });
    }
    assertValidUpload(file) {
        if (!file) {
            return;
        }
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new common_1.BadRequestException('Допустимы только изображения JPG, PNG или WebP');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new common_1.BadRequestException('Размер фото не должен превышать 5 МБ');
        }
    }
    getPublicPath(userId) {
        return `/uploads/avatars/user-${userId}.webp`;
    }
    async saveAvatar(userId, file, previousPhotoUrl) {
        this.assertValidUpload(file);
        const outputPath = (0, node_path_1.join)(this.avatarsDir, `user-${userId}.webp`);
        await (0, sharp_1.default)(file.buffer)
            .rotate()
            .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
            .webp({ quality: WEBP_QUALITY })
            .toFile(outputPath);
        if (previousPhotoUrl && previousPhotoUrl !== this.getPublicPath(userId)) {
            await this.deleteByPublicPath(previousPhotoUrl);
        }
        return this.getPublicPath(userId);
    }
    async deleteByPublicPath(photoUrl) {
        if (!photoUrl || !photoUrl.startsWith('/uploads/avatars/')) {
            return;
        }
        const fileName = photoUrl.replace('/uploads/avatars/', '');
        if (!fileName || fileName.includes('..')) {
            return;
        }
        const filePath = (0, node_path_1.join)(this.avatarsDir, fileName);
        try {
            await (0, promises_1.unlink)(filePath);
        }
        catch {
        }
    }
    async deleteAvatar(userId, photoUrl) {
        await this.deleteByPublicPath(photoUrl ?? this.getPublicPath(userId));
    }
};
exports.AvatarService = AvatarService;
exports.AvatarService = AvatarService = __decorate([
    (0, common_1.Injectable)()
], AvatarService);
//# sourceMappingURL=avatar.service.js.map