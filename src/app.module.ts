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
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { FollowModule } from './modules/follow/follow.module';
import { PostModule } from './modules/post/post.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,

      // every query in terminal
      // logging: true,
      // error: query in terminal when db return an error
      logging: ['query', 'error'],
      // query in terminal when execution time more then 200 ms
      maxQueryExecutionTime: 200,

      poolSize: 10,
      extra: {
        // request wait a 5s for a connection then get an error
        connectionTimeoutMillis: 5000,
        // if connection don't work 30s pool closed it
        idleTimeoutMillis: 30000,
      },
    }),

    CacheModule.register({
      stores: [
        new KeyvRedis(`redis://:${process.env.REDIS_PASSWORD}@localhost:6379`),
      ],
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

    AuthModule,
    UserModule,
    SessionModule,
    FollowModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
