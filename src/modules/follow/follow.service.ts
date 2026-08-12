import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Follow, FollowStatus } from './entities/follow.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { ConfirmFollowStatus } from './dto/confirm-subscription.dto';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    private readonly userService: UserService,
  ) {}

  async createFollow(
    followerId: string,
    followeeId: string,
    status?: FollowStatus,
  ): Promise<Follow> {
    const newFollow = this.followRepository.create({
      status,
      followee: { id: followeeId },
      follower: { id: followerId },
    });

    return await this.followRepository.save(newFollow);
  }

  async deleteFollow(id: string) {
    return this.followRepository.delete({ id });
  }

  getFollowById(followId: string): Promise<Follow | null> {
    return this.followRepository.findOne({
      where: { id: followId },
      relations: { followee: true, follower: true },
    });
  }

  async getFollowByIds(
    followerId: string,
    followeeId: string,
  ): Promise<Follow | null> {
    return this.followRepository.findOne({
      where: { followee: { id: followeeId }, follower: { id: followerId } },
      relations: { follower: true, followee: true },
    });
  }

  async getPendingFollowRequests(userId: string): Promise<Follow[]> {
    return this.followRepository.find({
      where: { followee: { id: userId }, status: FollowStatus.PENDING },
      relations: { follower: true },
    });
  }

  async subscribe(userId: string, followeeId: string): Promise<Follow | null> {
    if (userId === followeeId) {
      throw new ConflictException('You cannot subscribe to yourself');
    }

    const followeeExists = await this.userService.findById(followeeId);
    if (!followeeExists) {
      throw new ConflictException('User not found');
    }

    const alreadySubscribed = await this.getFollowByIds(userId, followeeId);
    if (alreadySubscribed) {
      throw new ConflictException('User already subscribed');
    }

    let follow: Follow;
    if (followeeExists.isPrivate) {
      follow = await this.createFollow(userId, followeeId);
    } else {
      follow = await this.createFollow(
        userId,
        followeeId,
        FollowStatus.ACCEPTED,
      );
    }

    return follow;
  }

  async unSubscribe(userId: string, followeeId: string) {
    if (userId === followeeId) {
      throw new ConflictException('You cannot unsubscribe from yourself');
    }

    const followeeExists = await this.getFollowByIds(userId, followeeId);
    if (!followeeExists) {
      throw new NotFoundException('You are not subscribed to this user');
    }

    await this.deleteFollow(followeeExists.id);
  }

  getMyFollowers(userId: string): Promise<Follow[]> {
    return this.followRepository.find({
      where: { followee: { id: userId }, status: FollowStatus.ACCEPTED },
      relations: { follower: true },
    });
  }

  getMyFollowees(userId: string): Promise<Follow[]> {
    return this.followRepository.find({
      where: { follower: { id: userId }, status: FollowStatus.ACCEPTED },
      relations: { followee: true },
    });
  }

  async confirmSubscription(
    userId: string,
    followId: string,
    status: ConfirmFollowStatus,
  ): Promise<boolean> {
    const follow = await this.getFollowById(followId);
    if (!follow) {
      throw new NotFoundException('This follow not found');
    }

    if (follow.followee.id !== userId) {
      throw new ForbiddenException('You cannot confirm this subscription');
    }

    if (follow.status === FollowStatus.ACCEPTED) {
      throw new ConflictException('Status already ACCEPTED');
    }

    if (status === ConfirmFollowStatus.ACCEPT) {
      await this.followRepository.update(
        { id: follow.id },
        { status: FollowStatus.ACCEPTED },
      );
      return true;
    } else {
      await this.deleteFollow(followId);
      return false;
    }
  }
}
