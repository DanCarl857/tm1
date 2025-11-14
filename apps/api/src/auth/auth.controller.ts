import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.auth.register(body.email, body.password);
    return user;
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.auth.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException();
    return this.auth.login(user);
  }
}
