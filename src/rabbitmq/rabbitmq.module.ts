import { Module } from '@nestjs/common';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitMQService } from './rabbitmq.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    GolevelupRabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABBITMQ_URL'),
        connectionOptions: {
          timeout: 100000, // Increase timeout to 10 seconds
        },
        exchanges: [
          {
            name: 'email_exchange',
            type: 'direct',
          },
        ],
        queues: [
          {
            name: 'email_queue',
            exchange: 'email_exchange',
            routingKey: 'email.verification',
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
