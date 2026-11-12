import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
export declare function parseCreateUserBody(body: Record<string, unknown>): CreateUserDto;
export declare function parseUpdateUserBody(body: Record<string, unknown>): UpdateUserDto;
