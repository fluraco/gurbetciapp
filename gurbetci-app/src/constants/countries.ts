import { CountryData } from '../types';

// Desteklenen ülkeler - Veritabanından alınacak şekilde tasarlanmış
export const COUNTRIES: CountryData[] = [
  {
    code: 'PL',
    name: 'Poland',
    name_tr: 'Polonya',
    flag: '🇵🇱',
    dialCode: '+48',
    isActive: true,
    displayOrder: 1,
  },
  {
    code: 'TR',
    name: 'Turkey',
    name_tr: 'Türkiye',
    flag: '🇹🇷',
    dialCode: '+90',
    isActive: true,
    displayOrder: 2,
  },
  {
    code: 'DE',
    name: 'Germany',
    name_tr: 'Almanya',
    flag: '🇩🇪',
    dialCode: '+49',
    isActive: true,
    displayOrder: 3,
  },
];

// Varsayılan ülke (Polonya)
export const DEFAULT_COUNTRY = COUNTRIES[0];

// Desteklenen ülke kodları
export const SUPPORTED_COUNTRY_CODES = COUNTRIES.map(country => country.code);
export const SUPPORTED_DIAL_CODES = COUNTRIES.map(country => country.dialCode);

// Ülke kodu ile ülke bulma
export const getCountryByCode = (code: string): CountryData | undefined => {
  return COUNTRIES.find(country => country.code === code);
};

// Telefon kodu ile ülke bulma
export const getCountryByDialCode = (dialCode: string): CountryData | undefined => {
  return COUNTRIES.find(country => country.dialCode === dialCode);
};

// Telefon numarasından ülke kodu çıkarma
export const extractCountryFromPhone = (phone: string): CountryData | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  for (const country of COUNTRIES) {
    if (phone.startsWith(country.dialCode)) {
      return country;
    }
  }
  
  return null;
};

// Şehir verileri - Veritabanından alınacak
export const CITIES = {
  PL: [
    { code: 'WAW', name: 'Warsaw', name_tr: 'Varşova' },
    { code: 'KRK', name: 'Krakow', name_tr: 'Krakov' },
    { code: 'GDN', name: 'Gdansk', name_tr: 'Gdansk' },
    { code: 'WRO', name: 'Wroclaw', name_tr: 'Wrocław' },
    { code: 'POZ', name: 'Poznan', name_tr: 'Poznan' },
    { code: 'LOD', name: 'Lodz', name_tr: 'Lodz' },
    { code: 'SZC', name: 'Szczecin', name_tr: 'Szczecin' },
    { code: 'LUB', name: 'Lublin', name_tr: 'Lublin' },
  ],
  TR: [
    { code: 'IST', name: 'Istanbul', name_tr: 'İstanbul' },
    { code: 'ANK', name: 'Ankara', name_tr: 'Ankara' },
    { code: 'IZM', name: 'Izmir', name_tr: 'İzmir' },
    { code: 'BUR', name: 'Bursa', name_tr: 'Bursa' },
    { code: 'ANT', name: 'Antalya', name_tr: 'Antalya' },
    { code: 'ADA', name: 'Adana', name_tr: 'Adana' },
    { code: 'KON', name: 'Konya', name_tr: 'Konya' },
    { code: 'GAZ', name: 'Gaziantep', name_tr: 'Gaziantep' },
  ],
  DE: [
    { code: 'BER', name: 'Berlin', name_tr: 'Berlin' },
    { code: 'MUN', name: 'Munich', name_tr: 'Münih' },
    { code: 'HAM', name: 'Hamburg', name_tr: 'Hamburg' },
    { code: 'COL', name: 'Cologne', name_tr: 'Köln' },
    { code: 'FRA', name: 'Frankfurt', name_tr: 'Frankfurt' },
    { code: 'STU', name: 'Stuttgart', name_tr: 'Stuttgart' },
    { code: 'DUS', name: 'Dusseldorf', name_tr: 'Düsseldorf' },
    { code: 'DOR', name: 'Dortmund', name_tr: 'Dortmund' },
    { code: 'ESS', name: 'Essen', name_tr: 'Essen' },
    { code: 'LEI', name: 'Leipzig', name_tr: 'Leipzig' },
  ],
}; 