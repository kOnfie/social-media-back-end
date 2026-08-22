import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { FollowService } from '../follow/follow.service';
import { FollowStatus } from '../follow/entities/follow.entity';

import { UpdatePost } from './interfaces/update-post.type';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly userService: UserService,
    private readonly followService: FollowService,
  ) {}

  private async canViewPrivateContent(
    requesterId: string,
    userId: string,
    userIsPrivate: boolean | undefined,
  ): Promise<boolean> {
    const idsMatch = requesterId === userId;

    if (!userIsPrivate || idsMatch) {
      return true;
    }

    const follow = await this.followService.getFollowByIds(requesterId, userId);
    if (follow?.status === FollowStatus.ACCEPTED) {
      return true;
    }

    return false;
  }

  findById(postId: string) {
    return this.postRepository.findOne({
      where: { id: postId },
      relations: { user: true },
    });
  }

  findByUserId(userId: string) {
    return this.postRepository.find({
      where: { user: { id: userId } },
      relations: { user: true },
    });
  }

  create(text: string, ownerId: string, photoUrl?: string) {
    const post = this.postRepository.create({
      text,
      photoUrl,
      user: { id: ownerId },
    });

    return this.postRepository.save(post);
  }

  async delete(userId: string, postId: string) {
    const post = await this.findById(postId);
    if (!post) {
      throw new NotFoundException('Post with this id not found');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException("You cannot delete someone else's post");
    }

    return this.postRepository.delete({
      id: postId,
      user: { id: userId },
    });
  }

  async getSomeonePosts(myId: string, userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userHasAccess = await this.canViewPrivateContent(
      myId,
      userId,
      user.isPrivate,
    );

    if (userHasAccess) {
      return this.findByUserId(userId);
    }

    return null;
  }

  async getSinglePost(postId: string, requesterId: string) {
    const post = await this.findById(postId);
    if (!post) {
      return null;
    }

    const user = post.user;
    const userHasAccess = await this.canViewPrivateContent(
      requesterId,
      user.id,
      user.isPrivate,
    );

    if (userHasAccess) {
      return post;
    }

    return null;
  }

  async updatePost(postId: string, ownerId: string, updatePostDto: UpdatePost) {
    const post = await this.findById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== ownerId) {
      throw new ForbiddenException('You cannot update not your own post');
    }

    Object.assign(post, updatePostDto);
    const updatedPost = this.postRepository.save(post);

    return updatedPost;
  }
}
