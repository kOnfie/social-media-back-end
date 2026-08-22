import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponse } from '@nestjs/swagger';
import { PostResponseDto } from './dto/responses/post-response.dto';
import { User } from '../user/entities/user.entity';
import { PostPresenter } from './post.presenter';

@UseGuards(AuthGuard)
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private postPresenter: PostPresenter,
  ) {}

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  async create(
    @CurrentUser() user: User,
    @Body() createPostDto: CreatePostDto,
  ) {
    const { text, photoUrl } = createPostDto;

    const post = await this.postService.create(text, user.id, photoUrl);
    const formattedPostWithUser = { ...post, user };

    return this.postPresenter.toResponse(formattedPostWithUser);
  }

  @Get('/by-user/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserPosts(
    @CurrentUser('id') myId: string,
    @Param('userId') userId: string,
  ) {
    const posts = await this.postService.getSomeonePosts(myId, userId);

    if (!posts) {
      return [];
    }

    return posts.map((post) => this.postPresenter.toResponse(post));
  }

  @Get('/my')
  @HttpCode(HttpStatus.OK)
  async getMyPosts(@CurrentUser('id') userId: string) {
    const posts = await this.postService.findByUserId(userId);

    return posts.map((post) => this.postPresenter.toResponse(post));
  }

  @Delete('/:postId')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    await this.postService.delete(userId, postId);

    return { message: 'Post deleted successfully' };
  }

  @Get('/:postId')
  async getSinglePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    const post = await this.postService.getSinglePost(postId, userId);
    if (!post) return {};

    return this.postPresenter.toResponse(post);
  }
}
