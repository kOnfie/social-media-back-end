import { Post } from '../entities/post.entity';

export type UpdatePost = Partial<Pick<Post, 'text'>>;
