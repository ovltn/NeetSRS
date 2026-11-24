import { SITE_DOMAIN, type SiteDomain } from '@/shared/site-domain';

export function getCurrentDomain(): SiteDomain {
  return SITE_DOMAIN;
}

export function getCurrentProblemSlug(): string | null {
  return window.location.pathname.match(/\/problems\/([^/]+)/)?.[1] || null;
}
