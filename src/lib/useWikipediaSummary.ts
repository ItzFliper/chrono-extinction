'use client';

import { useEffect, useState } from 'react';
import {
  fetchWikipediaSummary,
  getCachedWikipediaSummary,
  type WikipediaSummary,
} from '@/lib/wikipedia';

export function useWikipediaSummary(slug: string | null, enabled = true) {
  const [fetched, setFetched] = useState<{
    slug: string;
    summary: WikipediaSummary;
  } | null>(null);

  const memoryHit = slug ? getCachedWikipediaSummary(slug) : null;
  const summary =
    memoryHit ?? (fetched && fetched.slug === slug ? fetched.summary : null);

  useEffect(() => {
    if (!slug || !enabled || memoryHit) return;
    let active = true;
    fetchWikipediaSummary(slug).then((data) => {
      if (active) {
        setFetched({ slug, summary: data });
      }
    });
    return () => {
      active = false;
    };
  }, [slug, enabled, memoryHit]);

  return {
    summary,
    isLoading: Boolean(slug && enabled && !summary),
  };
}
