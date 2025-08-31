import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import enviroments from 'src/enviroments';
import { User } from '../../generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { isEmpty } from 'lodash';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register({
    city,
    role,
    name,
    email,
    password,
    phoneNumber,
  }: CreateUserDto) {
    const salt = await bcrypt.genSalt(Number(enviroments.SALT_PASSWORD));

    const passwordHash: string = bcrypt.hashSync(password, salt);

    return this.prisma.user.create({
      data: {
        city,
        role,
        name,
        email,
        password: passwordHash,
        phone: phoneNumber,
      },
    });
  }

  async login(user: User, res: Response) {
    const payload = { id: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '5m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const hashedToken = bcrypt.hashSync(
      refreshToken,
      Number(enviroments.SALT_PASSWORD),
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedToken },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return { access_token: accessToken };
  }

  async refreshTokens(refreshToken: string, res: Response) {
    try {
      const payload: User = this.jwtService.verify(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.id,
          refreshToken,
        },
      });

      if (isEmpty(user)) {
        throw new NotFoundException("User wasn't fount with this token");
      }

      const isRefreshTokenValid = await bcrypt.compare(
        user.refreshToken,
        refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { id: user.id, role: user.role };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '5m',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      res.cookie('jwtToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { accessToken: newAccessToken };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  findOneByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findUserByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  logout(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken: '' },
    });
  }
}
