import type { GeologicalEra, MassExtinctionEvent } from '@/types/species';

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
