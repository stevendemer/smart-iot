import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { promisify } from 'util';
import { createCipheriv, randomBytes, scrypt } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private readonly dbService: DbService) {}
}
