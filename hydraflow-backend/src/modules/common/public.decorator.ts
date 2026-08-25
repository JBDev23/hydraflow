import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark a route as reachable without JWT (e.g. login, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
