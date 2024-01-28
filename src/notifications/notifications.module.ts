import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AmpecoModule } from 'src/ampeco/ampeco.module';

@Module({
  providers: [NotificationsService],
  imports: [AmpecoModule],
})
export class NotificationsModule {}
