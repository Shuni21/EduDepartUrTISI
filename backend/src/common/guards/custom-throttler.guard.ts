import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async throwThrottlingException(): Promise<void> {
        throw new ThrottlerException(
            'Слишком много запросов. Подождите немного и попробуйте снова.',
        );
    }
}