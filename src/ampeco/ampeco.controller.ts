import { Controller, Get } from '@nestjs/common';
import { AmpecoService } from './ampeco.service';

@Controller('ampeco')
export class AmpecoController {
  constructor(private readonly ampecoService: AmpecoService) {}

  @Get()
  async getSession() {}
}
