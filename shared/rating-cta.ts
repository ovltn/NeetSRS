import { z } from 'zod';
import { storage } from '#imports';

// NeetSRS has no store listing yet, so rating prompts stay hidden.
export const reviewStore: { name: string; url: string } | null = null;

// Set only by a rating prompt's rate or decline action. Closing a prompt leaves later prompts eligible.
export const ratingCtaItem = storage.defineItem<unknown>('local:neetsrs:ratingCta');

export const ratingCtaResolutionSchema = z.object({
  outcome: z.enum(['rated', 'declined']),
  dialogId: z.string().min(1),
});
export type RatingCtaResolution = z.infer<typeof ratingCtaResolutionSchema>;

export async function readRatingCtaResolution(): Promise<RatingCtaResolution | null> {
  return ratingCtaResolutionSchema.nullable().parse((await ratingCtaItem.getValue()) ?? null);
}

export function writeRatingCtaResolution(resolution: RatingCtaResolution): Promise<void> {
  return ratingCtaItem.setValue(resolution);
}
