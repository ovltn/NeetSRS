import { z } from 'zod';

/** The one site NeetSRS runs on. Cards still record their domain, as LeetSRS cards do. */
export const SITE_DOMAIN = 'neetcode.io';
export const siteDomainSchema = z.literal(SITE_DOMAIN);
export type SiteDomain = z.infer<typeof siteDomainSchema>;
