export const marketEnumValues = ['MDA', 'MTR'] as const;

export const noteEnumValues = [
  'c_amb',
  'ca_aje',
  'r_com',
  'decrem',
  'sa_fda',
  'sa_prg',
  'prueba',
] as const;

export const hoursStringified = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
] as const;

export type HourStringified = (typeof hoursStringified)[number];
