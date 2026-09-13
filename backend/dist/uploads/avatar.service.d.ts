import { OnModuleInit } from '@nestjs/common';
export declare class AvatarService implements OnModuleInit {
    private readonly avatarsDir;
    onModuleInit(): Promise<void>;
    assertValidUpload(file?: Express.Multer.File): void;
    getPublicPath(userId: number): string;
    saveAvatar(userId: number, file: Express.Multer.File, previousPhotoUrl?: string | null): Promise<string>;
    deleteByPublicPath(photoUrl?: string | null): Promise<void>;
    deleteAvatar(userId: number, photoUrl?: string | null): Promise<void>;
}
