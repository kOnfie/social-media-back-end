import { randomInt } from 'crypto';

export const generateVerificationCode = (): number => {
  return randomInt(100000, 999999);
};
