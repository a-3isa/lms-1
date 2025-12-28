import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitMQService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async sendVerificationEmail(user: {
    email: string;
    username: string;
    verificationToken: string;
  }) {
    await this.amqpConnection.publish(
      'email_exchange',
      'email.verification',
      user,
    );
    console.log('📤 Verification email message published to RabbitMQ');
  }
}
