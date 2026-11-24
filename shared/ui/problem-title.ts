import type { CatalogProblem } from '@/shared/catalog';

export function getProblemTitle(problem: CatalogProblem): string {
  return problem.title;
}
