import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  @RabbitSubscribe({
    exchange: 'email_exchange',
    routingKey: 'email.verification',
    queue: 'email_queue',
  })
  async sendVerificationEmail(user: {
    email: string;
    username: string;
    verificationToken: string;
  }): Promise<void> {
    console.log('sending email to:', user.email);
    const sender = {
      address: 'hello@demomailtrap.co',
      name: 'Mailtrap Test',
    };

    await this.mailerService.sendMail({
      from: sender,
      to: user.email,
      subject: 'Verify Your Account',
      template: './verification',
      context: {
        userName: user.username,
        verificationLink: `http://localhost:3000/auth/verify?token=${user.verificationToken}`,
      },
    });
  }
}
