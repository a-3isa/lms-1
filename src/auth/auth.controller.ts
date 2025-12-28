import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserRegisterDto } from './dto/auth-credentials.dto';
import { UserLoginDto } from 'src/user/dto/user-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async register(@Body() createUserDto: UserRegisterDto) {
    await this.authService.register(createUserDto);
    return 'Registration successful. Please check your email to verify your account.';
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: { type: 'object', properties: { accessToken: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public login(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.login(userLoginDto);
  }

  @Get('/verify')
  @ApiOperation({ summary: 'Verify user account' })
  @ApiResponse({ status: 200, description: 'Account verified successfully' })
  @ApiResponse({ status: 404, description: 'Invalid token' })
  public async verify(@Query('token') token: string) {
    await this.authService.verifyUser(token);
    return 'Account verified successfully';
  }

  // @UseGuards(RoleGuard)
  @Post('/adminRegister')
  @ApiOperation({ summary: 'Register a new admin user' })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async adminRegister(@Body() createUserDto: UserRegisterDto) {
    await this.authService.adminRegister(createUserDto);
    return 'Welcome to the store';
  }
}
