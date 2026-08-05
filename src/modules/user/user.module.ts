import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Session } from 'src/modules/session/entities/session.entity';
import { SessionModule } from '../session/session.module';
import { UserPresenter } from './user.presenter';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session]), SessionModule],
  controllers: [UserController],
  providers: [UserService, UserPresenter],
  exports: [UserService, UserPresenter],
})
export class UserModule {}
