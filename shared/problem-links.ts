import type { SiteDomain } from '@/shared/site-domain';

interface ProblemLink {
  domain: SiteDomain;
  slug: string;
}

export function getProblemUrl({ domain, slug }: ProblemLink): string {
  return `https://${domain}/problems/${slug}/question`;
}
