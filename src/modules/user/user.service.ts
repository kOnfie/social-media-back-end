import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProfileDto } from './dto/profile.dto';
import { FollowService } from '../follow/follow.service';
import { FollowStatus } from '../follow/entities/follow.entity';
import { UpdateUserPrivacyDto } from './dto/update-user-privacy.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private followService: FollowService,
    private dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async getUsers(limit: number, offset: number): Promise<User[] | null> {
    return this.userRepository.find({
      take: limit,
      skip: (offset - 1) * limit,
      order: { id: 'ASC' },
    });
  }

  async createUser(email: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      email,
      passwordHash,
    });

    return this.userRepository.save(newUser);
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    this.userRepository.merge(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async updateUserPrivacy(
    userId: string,
    updateUserPrivacyDto: UpdateUserPrivacyDto,
  ): Promise<User | null> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) return null;

      const becamePublic =
        user.isPrivate === true && updateUserPrivacyDto.isPrivate === false;

      manager.merge(User, user, updateUserPrivacyDto);
      const saved = await manager.save(user);

      if (becamePublic) {
        await this.followService.acceptAllPending(userId, manager);
      }

      return saved;
    });
  }

  async updateUserPasswordHash(userId: string, passwordHash: string) {
    await this.userRepository.update({ id: userId }, { passwordHash });
  }

  async updateUserByEmail(
    email: string,
    updateUserDto: Partial<UpdateUserDto>,
  ): Promise<void> {
    await this.userRepository.update({ email }, { ...updateUserDto });
  }

  async updateUserVerifyByEmail(email: string, isVerified: boolean) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    await this.userRepository.update({ email }, { isVerified });
  }

  async getProfileById(userId: string): Promise<ProfileDto | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const [followerCount, followeeCount] = await Promise.all([
      this.followService.countFollowers(user.id),
      this.followService.countFollowees(user.id),
    ]);

    return {
      ...user,
      followerCount,
      followeeCount,
    };
  }

  findUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async getProfileByUsername(username: string): Promise<ProfileDto | null> {
    const user = await this.findUserByUsername(username);
    if (!user) return null;

    const [followerCount, followeeCount] = await Promise.all([
      this.followService.countFollowers(user.id),
      this.followService.countFollowees(user.id),
    ]);

    return {
      ...user,
      followerCount,
      followeeCount,
    };
  }

  async hasProfileAccess(viewerId: string, target: User): Promise<boolean> {
    if (!target.isPrivate || target.id === viewerId) return true;
    const follow = await this.followService.getFollowByIds(viewerId, target.id);
    return follow?.status === FollowStatus.ACCEPTED;
  }
}
