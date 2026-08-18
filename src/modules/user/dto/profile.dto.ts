import { User } from '../entities/user.entity';

export class ProfileDto extends User {
  followerCount!: number;
  followeeCount!: number;
}
