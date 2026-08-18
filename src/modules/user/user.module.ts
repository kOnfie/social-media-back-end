import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Session } from 'src/modules/session/entities/session.entity';
import { SessionModule } from '../session/session.module';
import { UserPresenter } from './user.presenter';
import { FollowModule } from '../follow/follow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    SessionModule,
    forwardRef(() => FollowModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserPresenter],
  exports: [UserService, UserPresenter],
})
export class UserModule {}
