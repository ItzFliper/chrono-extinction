export type SpeciesStatus = 'extinct' | 'endangered' | 'recovered';

export type EraId =
  | 'ordovician'
  | 'devonian'
  | 'permian'
  | 'triassic'
  | 'jurassic'
  | 'cretaceous'
  | 'paleogene-neogene'
  | 'pleistocene'
  | 'holocene-historical'
  | 'present';

export type TaxonGroup =
  | 'arthropod'
  | 'fish'
  | 'amphibian-reptile'
  | 'synapsid'
  | 'dinosaur-theropod'
  | 'dinosaur-herbivore'
  | 'pterosaur-marine'
  | 'mammal-megafauna'
  | 'mammal-carnivore'
  | 'mammal-ungulate'
  | 'cetacean'
  | 'bird';

export interface SpeciesTaxonomy {
  class: string;
  order: string;
  family: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  status: SpeciesStatus;
  /**
   * Numeric year for chronological sorting and logarithmic mapping.
   * Negative values represent BCE / years before present (e.g. -66000000 for 66 Ma, -10000 for 10,000 BCE).
   * Positive values represent CE (e.g. 1681, 1936, 2026).
   */
  extinctionYear: number;
  displayDate: string;
  era: string;
  eraId: EraId;
  cause: string;
  wikipediaSlug: string;
  taxonGroup: TaxonGroup;
  taxonomy?: SpeciesTaxonomy;
  region?: string;
  iucnBadge?: string;
  thumbnailUrl?: string;
  /** Higher priority surfaces earlier in Macro/Meso semantic zoom levels */
  landmarkPriority?: 1 | 2 | 3;
}

export interface GeologicalEra {
  id: EraId;
  name: string;
  shortName: string;
  startYearsAgo: number;
  endYearsAgo: number;
  color: string;
  accentHex: string;
  description: string;
}

export interface MassExtinctionEvent {
  id: string;
  name: string;
  shortName: string;
  yearsAgo: number;
  displayDate: string;
  speciesLossPct: string;
  primaryDriver: string;
  isBigFive: boolean;
}

export type EraJumpTarget = {
  id: string;
  label: string;
  sublabel: string;
  targetCenterLog: number;
  targetZoomSpanLog: number;
};

export type TaxonMacroFilter =
  | 'all'
  | 'mammals'
  | 'birds'
  | 'reptiles-dinosaurs'
  | 'marine-fish'
  | 'amphibians-invertebrates';

export type SortOrder = 'newest-first' | 'oldest-first';

export type StratumId =
  | 'present'
  | 'modern-extinctions'
  | 'ice-age-megafauna'
  | 'age-of-mammals'
  | 'age-of-dinosaurs'
  | 'ancient-oceans';
