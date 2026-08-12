import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FollowPresenter } from './follow.presenter';
import { ConfirmSubscriptionDto } from './dto/confirm-subscription.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Follow')
@Controller('follow')
@UseGuards(AuthGuard)
export class FollowController {
  constructor(
    private readonly followService: FollowService,
    private readonly followPresenter: FollowPresenter,
  ) {}

  @Post('/subscribe')
  @HttpCode(200)
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() subscribeDto: SubscribeDto,
  ) {
    const { userId: followeeId } = subscribeDto;

    const newFollow = await this.followService.subscribe(userId, followeeId);

    return {
      message: 'User subscribed',
      follow: this.followPresenter.toResponse(newFollow),
    };
  }

  @Post('/unsubscribe')
  @HttpCode(200)
  async unSubscribe(
    @CurrentUser('id') userId: string,
    @Body() subscribeDto: SubscribeDto,
  ) {
    await this.followService.unSubscribe(userId, subscribeDto.userId);

    return { message: 'User unsubscribed' };
  }

  @Get('/my-followers')
  async myFollowers(@CurrentUser('id') userId: string) {
    const followers = await this.followService.getMyFollowers(userId);
    const formattedFollowers = followers.map((follower) =>
      this.followPresenter.toResponse(follower),
    );

    return { followers: formattedFollowers };
  }

  @Get('/my-followees')
  @HttpCode(200)
  async myFollowee(@CurrentUser('id') userId: string) {
    const followees = await this.followService.getMyFollowees(userId);
    const formattedFollowees = followees.map((followee) =>
      this.followPresenter.toResponse(followee),
    );

    return { followees: formattedFollowees };
  }

  @Post('/confirm-subscription')
  @HttpCode(200)
  async confirmSubscription(
    @CurrentUser('id') userId: string,
    @Body() confirmSubscriptionDto: ConfirmSubscriptionDto,
  ) {
    const { followId, status } = confirmSubscriptionDto;

    const confirmSubscription = await this.followService.confirmSubscription(
      userId,
      followId,
      status,
    );
    if (!confirmSubscription) {
      return { message: 'Subscription was rejected' };
    }

    return { message: 'Subscription was accepted' };
  }

  @Get('/my-pending-requests')
  @HttpCode(200)
  async getPendingFollowRequests(@CurrentUser('id') userId: string) {
    const subscriptions =
      await this.followService.getPendingFollowRequests(userId);
    const formattedSubscriptions = subscriptions.map((sub) =>
      this.followPresenter.toResponse(sub),
    );

    return { subscriptions: formattedSubscriptions };
  }
}
