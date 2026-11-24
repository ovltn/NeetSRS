import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { learningDocumentQueryOptions } from '@/popup/queries/learning-document';
import { roadmapMetadataQueryOptions } from '@/popup/queries/roadmaps';
import { getProblemUrl } from '@/shared/problem-links';
import { getRecommendableRoadmapProblemIds, pickRandomRoadmapProblemId, type Roadmap } from '@/shared/roadmap';
import { SITE_DOMAIN } from '@/shared/site-domain';

/** Opens a random recommendable roadmap problem in a new tab; undefined while none is available. */
export function useOpenRandomProblem(roadmap: Roadmap): (() => void) | undefined {
  const { data: document } = useSuspenseQuery(learningDocumentQueryOptions);
  const domain = SITE_DOMAIN;
  const metadata = useQuery(roadmapMetadataQueryOptions(roadmap, domain));
  const ids = getRecommendableRoadmapProblemIds(roadmap, document, metadata.data, domain);
  if (ids.length === 0) return undefined;

  return () => {
    const id = pickRandomRoadmapProblemId(ids);
    const problem = id ? metadata.data?.[id] : undefined;
    if (problem) window.open(getProblemUrl({ domain, slug: problem.slug }), '_blank', 'noopener,noreferrer');
  };
}
