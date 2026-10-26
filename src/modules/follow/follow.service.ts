import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  UpdateResult,
} from 'typeorm';
import { Follow, FollowStatus } from './entities/follow.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfirmFollowStatus } from './dto/confirm-subscription.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    private dataSource: DataSource,
  ) {}

  async countFollowers(userId: string): Promise<number> {
    return this.followRepository.countBy({
      followee: { id: userId },
      status: FollowStatus.ACCEPTED,
    });
  }

  async countFollowees(userId: string): Promise<number> {
    return this.followRepository.countBy({
      follower: { id: userId },
      status: FollowStatus.ACCEPTED,
    });
  }

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
    });
  }

  async getPendingFollowRequests(userId: string): Promise<Follow[]> {
    const pendingRequests = await this.followRepository.find({
      where: { followee: { id: userId }, status: FollowStatus.PENDING },
      relations: { follower: true },
    });

    return pendingRequests.map((req) => {
      return { ...req, user: req.follower };
    });
  }

  async subscribe(userId: string, followeeId: string) {
    if (userId === followeeId) {
      throw new ConflictException('You cannot subscribe to yourself');
    }

    return this.dataSource.transaction(async (manager) => {
      const followeeExists = await manager.findOne(User, {
        where: { id: followeeId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!followeeExists) {
        throw new ConflictException('User not found');
      }

      const alreadySubscribed = await manager.findOne(Follow, {
        where: { followee: { id: followeeId }, follower: { id: userId } },
      });
      if (alreadySubscribed) {
        throw new ConflictException('User already subscribed');
      }

      const status = followeeExists.isPrivate
        ? undefined
        : FollowStatus.ACCEPTED;

      const newFollow = manager.create(Follow, {
        status,
        followee: { id: followeeId },
        follower: { id: userId },
      });
      const follow = await manager.save(Follow, newFollow);

      return { ...follow, user: follow.followee };
    });
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

  async getMyFollowers(userId: string): Promise<Follow[]> {
    const followers = await this.followRepository.find({
      where: { followee: { id: userId }, status: FollowStatus.ACCEPTED },
      relations: { follower: true },
    });

    const followersIds = followers.map((follower) => follower.follower.id);

    const userFollowees = await this.followRepository.find({
      where: { follower: { id: userId }, followee: { id: In(followersIds) } },
      relations: { followee: true },
    });

    const userFolloweeIds = new Set(userFollowees.map((f) => f.followee.id));

    return followers.map((follower) => {
      return {
        ...follower,
        user: follower.follower,
        isFollowee: userFolloweeIds.has(follower.follower.id),
      };
    });
  }

  async getMyFollowees(userId: string): Promise<Follow[]> {
    const followees = await this.followRepository.find({
      where: { follower: { id: userId }, status: FollowStatus.ACCEPTED },
      relations: { followee: true },
    });

    return followees.map((followee) => {
      return { ...followee, user: followee.followee };
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

  async acceptAllPending(
    userId: string,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return manager.update(
      Follow,
      { followee: { id: userId }, status: FollowStatus.PENDING },
      { status: FollowStatus.ACCEPTED },
    );
  }
}
