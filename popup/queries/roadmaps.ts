import { queryOptions } from '@tanstack/react-query';
import { background } from '@/shared/background-service';
import { type CatalogProblem, getProblemsByFrontendIds } from '@/shared/catalog';
import type { LearningDocument } from '@/shared/learning-document';
import { loadRoadmap, ROADMAP_IDS, type Roadmap, type RoadmapId, roadmapProblemIds } from '@/shared/roadmap';
import type { SiteDomain } from '@/shared/site-domain';
import { learningDocumentQueryOptions, useDocumentMutation } from './learning-document';

export const activeRoadmapQueryOptions = queryOptions({
  ...learningDocumentQueryOptions,
  select: (document: LearningDocument) => document.activeRoadmapId,
});

export function useActivateRoadmapMutation() {
  return useDocumentMutation((id: RoadmapId | null) => background.setActiveRoadmap(id));
}

export function useSkipRoadmapProblemMutation() {
  return useDocumentMutation(
    ({ roadmapId, frontendId, skipped }: { roadmapId: RoadmapId; frontendId: string; skipped: boolean }) =>
      background.setRoadmapProblemSkipped(roadmapId, frontendId, skipped),
    { scope: { id: 'roadmapSkips' } }
  );
}

export function roadmapMetadataQueryOptions(roadmap: Roadmap, domain: SiteDomain) {
  return queryOptions({
    queryKey: ['popupRoadmapMetadata', roadmap.id, domain],
    staleTime: Infinity,
    queryFn: async () => {
      const ids = roadmapProblemIds(roadmap);
      const problems = await getProblemsByFrontendIds(ids.map((frontendId) => ({ frontendId, domain })));

      return Object.fromEntries<CatalogProblem | undefined>(ids.map((id, index) => [id, problems[index]] as const));
    },
  });
}

export const roadmapsQueryOptions = queryOptions({
  queryKey: ['popupRoadmaps'],
  staleTime: Infinity,
  queryFn: () => Promise.all(ROADMAP_IDS.map(loadRoadmap)),
});
