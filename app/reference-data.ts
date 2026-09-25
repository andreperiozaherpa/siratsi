export const riskPoints = [
  { name: 'Pulau Tabuhan', level: 'multi' }, { name: 'Pulau Pahawang', level: 'single' },
  { name: 'Caligi', level: 'single' }, { name: 'Pulau Pasaran', level: 'single' },
  { name: 'Pulau Sebesi', level: 'single' }, { name: 'Pulau Legundi', level: 'multi' },
  { name: 'Merak Belatung', level: 'single' }, { name: 'Dermaga Ujung Bom', level: 'single' },
  { name: 'Ketapang, Bakauheni', level: 'single' }, { name: 'Sekampung, Labuhan Maringgai', level: 'multi' },
  { name: 'Kuala Penet', level: 'multi' }, { name: 'Kuala Teladas', level: 'multi' },
  { name: 'Muara Mesuji', level: 'single' },
] as const;
export const bases = [
  { name: 'Mesuji', ships: 1 }, { name: 'Kuala Teladas', ships: 1 },
  { name: 'Kuala Seputih', ships: 1 }, { name: 'Sungai Burung', ships: 1 },
  { name: 'Kuala Penet', ships: 1 }, { name: 'Labuhan Maringgai', ships: 1 },
  { name: 'Bakauheni', ships: 1 }, { name: 'Batu Payung', ships: 3 },
  { name: 'Puri Gading', ships: 9 }, { name: 'Lempasing', ships: 1 },
  { name: 'Ketapang', ships: 1 }, { name: 'Kota Agung', ships: 1 },
  { name: 'Pesisir Barat', ships: 1 }, { name: 'Panjang', ships: 2 },
] as const;
export const historicalCases = [
  { year: 2021, explosive: 8, fishing: 3, other: 0 },
  { year: 2022, explosive: 5, fishing: 0, other: 0 },
  { year: 2023, explosive: 0, fishing: 3, other: 0 },
  { year: 2024, explosive: 9, fishing: 2, other: 0 },
  { year: 2025, explosive: 10, fishing: 8, other: 1 },
] as const;
export const community = {
  inhabitedIslands: ['Pulau Pahawang', 'Pulau Legundi', 'Pulau Sabesi', 'Pulau Sebuku', 'Pulau Tabuan', 'Pulau Pisang', 'Pulau Tegal', 'Pulau Kelagian'],
  developedIslands: ['Pulau Pahawang', 'Pulau Pasaran', 'Pulau Rimau'],
  groups: 10,
};
