import React from 'react';
import type { TaxonGroup } from '@/types/species';

interface TaxonSilhouetteProps {
  group: TaxonGroup;
  className?: string;
}

export function TaxonSilhouette({ group, className = 'w-12 h-12' }: TaxonSilhouetteProps) {
  switch (group) {
    case 'arthropod':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <ellipse cx="32" cy="30" rx="14" ry="20" opacity="0.25" />
          <path d="M32 8c-7 0-12 5-12 12v18c0 9 5 16 12 18 7-2 12-9 12-18V20c0-7-5-12-12-12zm-8 14h16v3H24v-3zm0 7h16v3H24v-3zm1 7h14v3H25v-3z" />
          <path d="M18 22l-8-4m8 10l-9 1m9 8l-8 5M46 22l8-4m-8 10l9 1m-9 8l8 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M8 32c8-10 21-15 35-10l11-8v36l-11-8c-14 5-27 0-35-10z" />
          <path d="M24 22l7-9 6 8" opacity="0.85" />
          <circle cx="17" cy="29" r="2.3" fill="#060913" />
        </svg>
      );
    case 'amphibian-reptile':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 36c6-9 17-12 29-9 8 2 14 7 15 10-7 2-12-1-17 0-8 2-17 3-27-1z" />
          <path d="M22 39l-4 9m18-9l4 9m-24-11l-7 3m43-3l6-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="18" cy="31" r="2" fill="#060913" />
        </svg>
      );
    case 'synapsid':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19 31c2-13 9-19 16-19s12 7 13 19H19z" opacity="0.7" />
          <path d="M10 38c4-6 12-8 23-8h14c5 0 9 3 9 7l-12 3c-8 1-14 2-21 1l-13-3z" />
          <path d="M20 40l-2 11m10-10l1 10m11-10l-1 10m9-10l3 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'dinosaur-theropod':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M40 12c6 0 11 3 11 8 0 4-3 6-8 6h-5l-4 8c5 3 7 9 6 15l-4 7h-5l3-11c-5-2-10-4-17-3l-11 2 9-7c8-4 14-8 19-16l3-9h3z" />
          <circle cx="46" cy="17" r="1.8" fill="#060913" />
        </svg>
      );
    case 'dinosaur-herbivore':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 36c3-11 12-17 24-16 8 1 13 5 16 11l6 2-5 5H17l-9 3 4-5z" />
          <path d="M20 38v14m9-14v14m13-14v14m8-14v14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M48 22l7-6m-4 9l7-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'pterosaur-marine':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M8 28l18-12 8 11 22-9-17 17-7 13-5-11-19-9z" />
          <path d="M35 28l16-4-12 7z" opacity="0.8" />
        </svg>
      );
    case 'cetacean':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M10 34c7-11 22-14 35-8 5 2 9 6 12 8-5 2-9 5-15 5-11 0-21-2-32-5z" />
          <path d="M51 34l9-7-2 8 4 6-11-4zM29 24l4-8 4 8" />
          <path d="M23 36l-4 9 7-6" />
        </svg>
      );
    case 'bird':
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M16 40c2-11 11-18 22-18 5 0 9-3 12-7l4 4-5 6c1 7-4 14-12 17-7 3-14 2-21-2z" />
          <path d="M28 42l-2 11m8-11l3 11m14-31l7 2-7 3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="48" cy="21" r="1.8" fill="#060913" />
        </svg>
      );
    case 'mammal-megafauna':
    case 'mammal-ungulate':
    case 'mammal-carnivore':
    default:
      return (
        <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
          <path d="M13 36c3-10 11-16 23-16 8 0 14 4 17 10l5 3-3 5-5-1c-4 3-10 4-18 4H16l-3-5z" />
          <path d="M18 40v13m9-13v13m14-13v13m7-13v13" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="49" cy="29" r="1.8" fill="#060913" />
        </svg>
      );
  }
}
