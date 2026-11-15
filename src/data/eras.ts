import type {
  EraId,
  GeologicalEra,
  MassExtinctionEvent,
  Species,
  StratumId,
  TaxonMacroFilter,
} from '@/types/species';

export const GEOLOGICAL_ERAS: GeologicalEra[] = [
  {
    id: 'ordovician',
    name: 'Ordovician – Silurian',
    shortName: 'Ordovician',
    startYearsAgo: 485_400_000,
    endYearsAgo: 419_200_000,
    color: 'rgba(14, 165, 233, 0.1)',
    accentHex: '#38bdf8',
    description:
      'Marine biodiversity explosion followed by the End-Ordovician glaciation.',
  },
  {
    id: 'devonian',
    name: 'Devonian ("Age of Fishes")',
    shortName: 'Devonian',
    startYearsAgo: 419_200_000,
    endYearsAgo: 358_900_000,
    color: 'rgba(6, 182, 212, 0.1)',
    accentHex: '#22d3ee',
    description:
      'Jawed placoderms rule the seas while the first tetrapods step onto land.',
  },
  {
    id: 'permian',
    name: 'Carboniferous – Permian',
    shortName: 'Permian',
    startYearsAgo: 358_900_000,
    endYearsAgo: 251_900_000,
    color: 'rgba(249, 115, 22, 0.1)',
    accentHex: '#fb923c',
    description:
      'Synapsids dominate Pangaea until Siberian Traps volcanism triggers The Great Dying.',
  },
  {
    id: 'triassic',
    name: 'Triassic',
    shortName: 'Triassic',
    startYearsAgo: 251_900_000,
    endYearsAgo: 201_300_000,
    color: 'rgba(234, 88, 12, 0.1)',
    accentHex: '#f97316',
    description:
      'Biosphere recovery from the Permian catastrophe and the dawn of early dinosaurs.',
  },
  {
    id: 'jurassic',
    name: 'Jurassic',
    shortName: 'Jurassic',
    startYearsAgo: 201_300_000,
    endYearsAgo: 145_000_000,
    color: 'rgba(34, 197, 94, 0.1)',
    accentHex: '#4ade80',
    description:
      'Giant sauropods, armored stegosaurs, marine reptiles, and early avians flourish.',
  },
  {
    id: 'cretaceous',
    name: 'Cretaceous',
    shortName: 'Cretaceous',
    startYearsAgo: 145_000_000,
    endYearsAgo: 66_000_000,
    color: 'rgba(132, 204, 22, 0.1)',
    accentHex: '#a3e635',
    description:
      'Apex theropods and horned dinosaurs thrive until the Chicxulub asteroid impact.',
  },
  {
    id: 'paleogene-neogene',
    name: 'Paleogene – Neogene',
    shortName: 'Cenozoic',
    startYearsAgo: 66_000_000,
    endYearsAgo: 2_580_000,
    color: 'rgba(234, 179, 8, 0.09)',
    accentHex: '#facc15',
    description:
      'Mammals and giant sharks diversify across evolving oceans and grasslands.',
  },
  {
    id: 'pleistocene',
    name: 'Pleistocene Ice Age',
    shortName: 'Pleistocene',
    startYearsAgo: 2_580_000,
    endYearsAgo: 11_700,
    color: 'rgba(99, 102, 241, 0.11)',
    accentHex: '#818cf8',
    description:
      'Iconic megafauna roam glacial steppes before rapid deglaciation and human dispersal.',
  },
  {
    id: 'holocene-historical',
    name: 'Holocene & Historical Era',
    shortName: 'Historical',
    startYearsAgo: 11_700,
    endYearsAgo: 1,
    color: 'rgba(244, 63, 94, 0.1)',
    accentHex: '#fb7185',
    description:
      'Island endemics and continental herds face rapid human hunting and habitat transformation.',
  },
  {
    id: 'present',
    name: 'The Present (Anthropocene)',
    shortName: 'Present',
    startYearsAgo: 1,
    endYearsAgo: 0,
    color: 'rgba(16, 185, 129, 0.12)',
    accentHex: '#34d399',
    description:
      'A decisive crossroads between modern extinction threats and active species recovery.',
  },
];

export const MASS_EXTINCTION_EVENTS: MassExtinctionEvent[] = [
  {
    id: 'end-ordovician',
    name: 'End-Ordovician Extinction',
    shortName: 'Ordovician–Silurian',
    yearsAgo: 444_000_000,
    displayDate: '444 Ma',
    speciesLossPct: '~85% of marine species',
    primaryDriver:
      'Hirnantian glaciation, rapid global cooling, and severe sea-level drop followed by ocean anoxia.',
    isBigFive: true,
  },
  {
    id: 'late-devonian',
    name: 'Late Devonian Extinction',
    shortName: 'Kellwasser / Hangenberg',
    yearsAgo: 372_000_000,
    displayDate: '372 Ma',
    speciesLossPct: '~75% of all species',
    primaryDriver:
      'Widespread oceanic anoxia, continental weathering from deep-rooted vascular plants, and climatic cooling.',
    isBigFive: true,
  },
  {
    id: 'end-permian',
    name: 'Permian–Triassic Extinction ("The Great Dying")',
    shortName: 'End-Permian',
    yearsAgo: 251_900_000,
    displayDate: '252 Ma',
    speciesLossPct: '~96% marine, ~70% terrestrial',
    primaryDriver:
      'Massive Siberian Traps flood volcanism causing runaway greenhouse warming, ocean acidification, and anoxia.',
    isBigFive: true,
  },
  {
    id: 'end-triassic',
    name: 'Triassic–Jurassic Extinction',
    shortName: 'End-Triassic',
    yearsAgo: 201_300_000,
    displayDate: '201 Ma',
    speciesLossPct: '~80% of all species',
    primaryDriver:
      'Central Atlantic Magmatic Province volcanism during Pangaea rifting, elevating CO₂ and ocean acidification.',
    isBigFive: true,
  },
  {
    id: 'end-cretaceous',
    name: 'Cretaceous–Paleogene Extinction (K–Pg)',
    shortName: 'End-Cretaceous',
    yearsAgo: 66_000_000,
    displayDate: '66 Ma',
    speciesLossPct: '~76% of all species',
    primaryDriver:
      'Chicxulub bolide impact in Yucatán coupled with Deccan Traps volcanism, triggering an impact winter.',
    isBigFive: true,
  },
  {
    id: 'quaternary-megafauna',
    name: 'Late Quaternary Megafauna Pulse',
    shortName: 'End-Pleistocene',
    yearsAgo: 12_000,
    displayDate: 'c. 10,000 BCE',
    speciesLossPct: 'Over half of large mammals (>44 kg)',
    primaryDriver:
      'Synergy of rapid Younger Dryas / Holocene climate shifts and expanding Paleolithic human hunting.',
    isBigFive: false,
  },
];

export interface AtlasStratum {
  id: StratumId;
  title: string;
  shortTitle: string;
  subtitle: string;
  timespan: string;
  depthLabel: string;
  eraIds: EraId[];
  accentHex: string;
  badgeClass: string;
  bannerGradient: string;
  borderClass: string;
  description: string;
  extinctionCallouts: MassExtinctionEvent[];
}

export const ATLAS_STRATA: AtlasStratum[] = [
  {
    id: 'present',
    title: 'The Present · Anthropocene Crossroads',
    shortTitle: 'Present',
    subtitle: 'Active Crisis & Conservation Recoveries',
    timespan: '2026 CE · Surface Layer',
    depthLabel: '0 m · 2026 CE',
    eraIds: ['present'],
    accentHex: '#34d399',
    badgeClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200',
    bannerGradient: 'from-amber-950/35 via-slate-900/90 to-emerald-950/35',
    borderClass: 'border-emerald-500/30',
    description:
      'A decisive planetary crossroads: species fighting for survival on the brink alongside landmark conservation recoveries brought back from extinction.',
    extinctionCallouts: [],
  },
  {
    id: 'modern-extinctions',
    title: 'Modern & Historical Extinctions',
    shortTitle: 'Modern (1500+)',
    subtitle: 'Holocene & Anthropocene Losses',
    timespan: '10,000 BCE – Present (1500 CE – 2025 CE Pulse)',
    depthLabel: '120 m · 1500 CE–Now',
    eraIds: ['holocene-historical'],
    accentHex: '#fb7185',
    badgeClass: 'bg-rose-500/15 border-rose-400/40 text-rose-200',
    bannerGradient: 'from-rose-950/40 via-slate-900/90 to-slate-950/90',
    borderClass: 'border-rose-500/30',
    description:
      'Island endemics, flightless birds, and continental apex predators lost to rapid human expansion, overhunting, invasive species, and habitat transformation.',
    extinctionCallouts: [],
  },
  {
    id: 'ice-age-megafauna',
    title: 'Ice Age & Megafauna',
    shortTitle: 'Pleistocene',
    subtitle: 'Quaternary Glacial Cycles',
    timespan: '2.58 Ma – 11,700 Years Ago',
    depthLabel: '450 m · 2.58 Ma',
    eraIds: ['pleistocene'],
    accentHex: '#818cf8',
    badgeClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-200',
    bannerGradient: 'from-indigo-950/45 via-slate-900/90 to-sky-950/30',
    borderClass: 'border-indigo-500/30',
    description:
      'Towering mammoths, saber-toothed cats, giant ground sloths, and armored glyptodonts that roamed glacial steppes before abrupt deglaciation and human dispersal.',
    extinctionCallouts: MASS_EXTINCTION_EVENTS.filter((ev) => ev.id === 'quaternary-megafauna'),
  },
  {
    id: 'age-of-mammals',
    title: 'Age of Mammals (Cenozoic)',
    shortTitle: 'Cenozoic',
    subtitle: 'Paleogene & Neogene Radiations',
    timespan: '66 Ma – 2.58 Ma',
    depthLabel: '1,200 m · 66 Ma',
    eraIds: ['paleogene-neogene'],
    accentHex: '#facc15',
    badgeClass: 'bg-amber-500/15 border-amber-400/40 text-amber-200',
    bannerGradient: 'from-amber-950/40 via-slate-900/90 to-yellow-950/25',
    borderClass: 'border-amber-500/30',
    description:
      'Following the Chicxulub impact, mammals, terror birds, giant crocodiles, and apex sharks radiated rapidly across tropical forests, grasslands, and evolving oceans.',
    extinctionCallouts: [],
  },
  {
    id: 'age-of-dinosaurs',
    title: 'Age of Dinosaurs (Mesozoic)',
    shortTitle: 'Mesozoic',
    subtitle: 'Cretaceous · Jurassic · Triassic',
    timespan: '252 Ma – 66 Ma',
    depthLabel: '2,600 m · 252 Ma',
    eraIds: ['cretaceous', 'jurassic', 'triassic'],
    accentHex: '#a3e635',
    badgeClass: 'bg-lime-500/15 border-lime-400/40 text-lime-200',
    bannerGradient: 'from-emerald-950/35 via-slate-900/90 to-lime-950/30',
    borderClass: 'border-lime-500/30',
    description:
      '186 million years of archosaur dominance: colossal sauropods, apex theropods, horned ceratopsians, pterosaurs, mosasaurs, plesiosaurs, and the first birds.',
    extinctionCallouts: MASS_EXTINCTION_EVENTS.filter(
      (ev) => ev.id === 'end-cretaceous' || ev.id === 'end-triassic'
    ),
  },
  {
    id: 'ancient-oceans',
    title: 'Ancient Oceans & Monsters (Paleozoic)',
    shortTitle: 'Paleozoic',
    subtitle: 'Permian · Devonian · Ordovician · Cambrian',
    timespan: '540 Ma – 252 Ma',
    depthLabel: '4,200 m · 540 Ma',
    eraIds: ['permian', 'devonian', 'ordovician'],
    accentHex: '#38bdf8',
    badgeClass: 'bg-sky-500/15 border-sky-400/40 text-sky-200',
    bannerGradient: 'from-sky-950/45 via-slate-900/90 to-cyan-950/35',
    borderClass: 'border-sky-500/30',
    description:
      "From the Cambrian explosion's radiodonts and trilobites to giant Devonian armored placoderms, Carboniferous coal-swamp arthropods, and Permian synapsids.",
    extinctionCallouts: MASS_EXTINCTION_EVENTS.filter(
      (ev) =>
        ev.id === 'end-permian' || ev.id === 'late-devonian' || ev.id === 'end-ordovician'
    ),
  },
];

const ERA_TO_STRATUM_MAP: Record<EraId, StratumId> = {
  present: 'present',
  'holocene-historical': 'modern-extinctions',
  pleistocene: 'ice-age-megafauna',
  'paleogene-neogene': 'age-of-mammals',
  cretaceous: 'age-of-dinosaurs',
  jurassic: 'age-of-dinosaurs',
  triassic: 'age-of-dinosaurs',
  permian: 'ancient-oceans',
  devonian: 'ancient-oceans',
  ordovician: 'ancient-oceans',
};

export function getStratumIdForSpecies(species: Species): StratumId {
  return ERA_TO_STRATUM_MAP[species.eraId] ?? 'modern-extinctions';
}

export function matchesTaxonMacroFilter(species: Species, filter: TaxonMacroFilter): boolean {
  if (filter === 'all') return true;
  const tg = species.taxonGroup;
  const cls = species.taxonomy?.class ?? '';

  switch (filter) {
    case 'mammals':
      return (
        tg === 'mammal-megafauna' ||
        tg === 'mammal-carnivore' ||
        tg === 'mammal-ungulate' ||
        tg === 'cetacean' ||
        tg === 'synapsid'
      );
    case 'birds':
      return tg === 'bird';
    case 'reptiles-dinosaurs':
      return (
        tg === 'dinosaur-theropod' ||
        tg === 'dinosaur-herbivore' ||
        tg === 'pterosaur-marine' ||
        (tg === 'amphibian-reptile' && /reptilia|sauropsida|reptiliomorpha/i.test(cls))
      );
    case 'marine-fish':
      return tg === 'fish' || tg === 'cetacean' || tg === 'pterosaur-marine';
    case 'amphibians-invertebrates':
      return (
        tg === 'arthropod' ||
        (tg === 'amphibian-reptile' && !/reptilia|sauropsida|reptiliomorpha/i.test(cls))
      );
    default:
      return true;
  }
}
