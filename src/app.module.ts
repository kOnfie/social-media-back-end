import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { SessionModule } from './modules/session/session.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { FollowModule } from './modules/follow/follow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'denismatveev',
      database: 'social_media_db',
      autoLoadEntities: true,
      synchronize: true,
    }),

    CacheModule.register({
      stores: [
        new KeyvRedis(`redis://:${process.env.REDIS_PASSWORD}@localhost:6379`),
      ],
      isGlobal: true,
    }),

    AuthModule,
    UserModule,
    SessionModule,
    FollowModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    AppService,
  ],
})
export class AppModule {}
