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
    updateUserDto: Partial<UpdateUserDto>,
  ): Promise<User | null> {
    await this.userRepository.update({ id: userId }, { ...updateUserDto });

    return this.userRepository.findOneBy({ id: userId });
  }

  async updateUserByEmail(
    email: string,
    updateUserDto: Partial<UpdateUserDto>,
  ): Promise<void> {
    await this.userRepository.update({ email }, { ...updateUserDto });
  }
}
