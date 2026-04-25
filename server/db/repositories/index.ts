/**
 * server/db/repositories/index.ts
 *
 * Barrel — import any repository from '@/server/db'.
 */

export { usersRepository } from './users';
export {
  writerProfilesRepository,
  vocalistProfilesRepository,
  producerProfilesRepository,
  literaryContributorProfilesRepository,
  studioProfilesRepository,
  profilesRepository,
} from './profiles';
export {
  kalamsRepository,
  sadasRepository,
  articlesRepository,
  contactRepository,
  partnershipRepository,
  notificationsRepository,
} from './content';
export { releasesRepository } from './releases';
