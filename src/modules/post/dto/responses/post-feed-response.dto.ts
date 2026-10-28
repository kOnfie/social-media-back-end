import { PostResponseDto } from './post-response.dto';

class NextCursor {
  id!: string;
  createdAt!: Date;
}

export class PostFeedResponseDto {
  nextCursor!: NextCursor | null;
  posts!: PostResponseDto[];
}
