import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { appConfig } from '../../../common/config/configuration';

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(`${password}${appConfig.auth.passwordPepper}`, {
      type: argon2.argon2id,
    });
  }

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return argon2.verify(passwordHash, `${password}${appConfig.auth.passwordPepper}`);
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
