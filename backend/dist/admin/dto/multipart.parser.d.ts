import type { Request } from 'express';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
export declare function parseCreateUserBody(body: Record<string, unknown>): CreateUserDto;
export declare function parseUpdateUserBody(body: Record<string, unknown>): UpdateUserDto;
export declare const avatarUploadOptions: {
    limits: {
        fileSize: number;
    };
    fileFilter: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
};
