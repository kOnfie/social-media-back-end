import { forwardRef, Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';
import { FollowPresenter } from './follow.presenter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow]),
    forwardRef(() => UserModule),
    SessionModule,
  ],
  controllers: [FollowController],
  providers: [FollowService, FollowPresenter],
  exports: [FollowService],
})
export class FollowModule {}
