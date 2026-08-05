import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { sessions: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async createUser(email: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      email,
      passwordHash,
    });

    return this.userRepository.save(newUser);
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    this.userRepository.merge(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async updateUserPasswordHash(userId: string, passwordHash: string) {
    await this.userRepository.update({ id: userId }, { passwordHash });
  }

  async updateUserByEmail(
    email: string,
    updateUserDto: Partial<UpdateUserDto>,
  ): Promise<void> {
    await this.userRepository.update({ email }, { ...updateUserDto });
  }

  async updateUserVerifyByEmail(email: string, isVerified: boolean) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    await this.userRepository.update({ email }, { isVerified });
  }
}
