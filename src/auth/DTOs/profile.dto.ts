import { Exclude } from 'class-transformer';

export class UserProfileDto {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  dni: string;
  role: string;

  @Exclude()
  password?: string;

  @Exclude()
  auth0Id?: string;

  @Exclude()
  provider?: string;

  @Exclude()
  emailVerified?: boolean;

  @Exclude()
  picture?: string;

  @Exclude()
  locale?: string;

  @Exclude()
  lastLogin?: Date;

  @Exclude()
  deletedAt?: Date;

  constructor(partial: Partial<UserProfileDto>) {
    Object.assign(this, partial);
  }
}
