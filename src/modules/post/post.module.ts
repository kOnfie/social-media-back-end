import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';

import { SessionModule } from '../session/session.module';
import { PostPresenter } from './post.presenter';
import { UserModule } from '../user/user.module';
import { FollowModule } from '../follow/follow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    SessionModule,
    UserModule,
    FollowModule,
  ],
  controllers: [PostController],
  providers: [PostService, PostPresenter],
})
export class PostModule {}
