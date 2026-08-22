import { plainToInstance } from 'class-transformer';
import { PostResponseDto } from './dto/responses/post-response.dto';
import { Post } from './entities/post.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostPresenter {
  public toResponse(post: Post) {
    return plainToInstance(PostResponseDto, post, {
      excludeExtraneousValues: true,
    });
  }
}
