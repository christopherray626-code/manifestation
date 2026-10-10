/**
 * The starter themes. Every screen reads its look from here, so a theme can change
 * colors, fonts, shapes and small touches (stars, the orb, the moon) without new layouts.
 */
export type Theme = {
  id: string;
  name: string;
  group: 'mystical' | 'everyday';
  blurb: string;
  dark: boolean;
  colors: {
    bg: string;
    /** Background of filled cards. */
    card: string;
    /** Text inputs. */
    field: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    onAccent: string;
    label: string;
    tabInactive: string;
    /** Thin ornamental frame (tarot-style), where used. */
    frame: string;
    /** Soft tints behind goal icons. */
    tints: string[];
  };
  fonts: {
    display: string;
    body: string;
    bodyMedium: string;
    label: string;
    quote: string;
    button: string;
  };
  displayCaps: boolean;
  labelCaps: boolean;
  labelSpacing: number;
  buttonCaps: boolean;
  radius: number;
  card: 'outline' | 'filled' | 'white' | 'line';
  quote: 'frame' | 'card' | 'bar' | 'plain';
  goalIcon: 'ring' | 'tile' | 'none';
  decor: 'stars' | 'orb' | 'none';
  tagline: 'moon' | 'streak' | 'none';
  romanDays: boolean;
  greetingSuffix?: string;
};

const inter = {
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
};

export const themes: Theme[] = [
  {
    id: 'celestial',
    name: 'Celestial',
    group: 'mystical',
    blurb: 'Midnight navy, gold and stars',
    dark: true,
    colors: {
      bg: '#0B1026',
      card: '#121838',
      field: '#121838',
      border: '#3A3F6B',
      text: '#E9E4D4',
      muted: '#A9A6C9',
      accent: '#D9B95C',
      onAccent: '#0B1026',
      label: '#B8A06A',
      tabInactive: '#6E6C94',
      frame: '#8C6E3F',
      tints: ['#1A2150', '#1E1A44', '#14264A'],
    },
    fonts: {
      ...inter,
      display: 'CormorantGaramond_500Medium',
      label: 'Cinzel_400Regular',
      quote: 'CormorantGaramond_400Regular_Italic',
      button: 'Cinzel_500Medium',
    },
    displayCaps: false,
    labelCaps: true,
    labelSpacing: 1.5,
    buttonCaps: true,
    radius: 14,
    card: 'outline',
    quote: 'frame',
    goalIcon: 'ring',
    decor: 'stars',
    tagline: 'moon',
    romanDays: false,
  },
  {
    id: 'aura',
    name: 'Cosmic aura',
    group: 'mystical',
    blurb: 'Deep violet with a glowing orb',
    dark: true,
    colors: {
      bg: '#1A0B2E',
      card: '#2A1447',
      field: '#2A1447',
      border: '#3D2363',
      text: '#F2E9FF',
      muted: '#B79AE0',
      accent: '#E7B8FF',
      onAccent: '#1A0B2E',
      label: '#B79AE0',
      tabInactive: '#7A5BA6',
      frame: '#8A4FD8',
      tints: ['#FF8AD8', '#7FE3D3', '#FFD58A'],
    },
    fonts: {
      ...inter,
      display: 'Inter_500Medium',
      label: 'Inter_500Medium',
      quote: 'Inter_400Regular',
      button: 'Inter_500Medium',
    },
    displayCaps: false,
    labelCaps: false,
    labelSpacing: 0,
    buttonCaps: false,
    radius: 18,
    card: 'filled',
    quote: 'card',
    goalIcon: 'tile',
    decor: 'orb',
    tagline: 'none',
    romanDays: false,
  },
  {
    id: 'tarot',
    name: 'Tarot ritual',
    group: 'mystical',
    blurb: 'Candlelit black and aged gold',
    dark: true,
    colors: {
      bg: '#15110D',
      card: '#1E1813',
      field: '#1E1813',
      border: '#5A4630',
      text: '#EADBC0',
      muted: '#8C7656',
      accent: '#C9A365',
      onAccent: '#15110D',
      label: '#B8925A',
      tabInactive: '#6B5A44',
      frame: '#8C6E3F',
      tints: ['#2A2118', '#2A2118', '#2A2118'],
    },
    fonts: {
      ...inter,
      display: 'CormorantGaramond_500Medium',
      label: 'Cinzel_400Regular',
      quote: 'CormorantGaramond_400Regular_Italic',
      button: 'Cinzel_500Medium',
    },
    displayCaps: false,
    labelCaps: true,
    labelSpacing: 2,
    buttonCaps: true,
    radius: 6,
    card: 'outline',
    quote: 'frame',
    goalIcon: 'ring',
    decor: 'none',
    tagline: 'none',
    romanDays: true,
  },
  {
    id: 'clean',
    name: 'Clean',
    group: 'everyday',
    blurb: 'White and black, nothing extra',
    dark: false,
    colors: {
      bg: '#FAFAF8',
      card: '#FFFFFF',
      field: '#FFFFFF',
      border: '#E4E2DC',
      text: '#1C1C1A',
      muted: '#8A8880',
      accent: '#1C1C1A',
      onAccent: '#FFFFFF',
      label: '#8A8880',
      tabInactive: '#B5B3AC',
      frame: '#E4E2DC',
      tints: ['#F1F0EC', '#F1F0EC', '#F1F0EC'],
    },
    fonts: {
      ...inter,
      display: 'Inter_500Medium',
      label: 'Inter_500Medium',
      quote: 'Inter_500Medium',
      button: 'Inter_500Medium',
    },
    displayCaps: false,
    labelCaps: false,
    labelSpacing: 0,
    buttonCaps: false,
    radius: 14,
    card: 'white',
    quote: 'plain',
    goalIcon: 'none',
    decor: 'none',
    tagline: 'none',
    romanDays: false,
  },
  {
    id: 'soft',
    name: 'Soft girl',
    group: 'everyday',
    blurb: 'Beige, blush and sage',
    dark: false,
    colors: {
      bg: '#F6EEE6',
      card: '#EBD9D0',
      field: '#FFFFFF',
      border: '#E2CFC3',
      text: '#4A3B33',
      muted: '#A08A7C',
      accent: '#B9786A',
      onAccent: '#FFFFFF',
      label: '#A08A7C',
      tabInactive: '#C9B6AA',
      frame: '#E2CFC3',
      tints: ['#F6EEE6', '#F6EEE6', '#F6EEE6'],
    },
    fonts: {
      ...inter,
      display: 'DMSerifDisplay_400Regular',
      label: 'Inter_500Medium',
      quote: 'DMSerifDisplay_400Regular_Italic',
      button: 'Inter_500Medium',
    },
    displayCaps: false,
    labelCaps: false,
    labelSpacing: 0,
    buttonCaps: false,
    radius: 18,
    card: 'filled',
    quote: 'card',
    goalIcon: 'tile',
    decor: 'none',
    tagline: 'none',
    romanDays: false,
    greetingSuffix: 'babe',
  },
  {
    id: 'oldmoney',
    name: 'Old money',
    group: 'everyday',
    blurb: 'Black and champagne, magazine style',
    dark: true,
    colors: {
      bg: '#14120F',
      card: '#1C1915',
      field: '#1C1915',
      border: '#2E2A22',
      text: '#EDE6D6',
      muted: '#9C8B6A',
      accent: '#D8C49A',
      onAccent: '#14120F',
      label: '#9C8B6A',
      tabInactive: '#5A5244',
      frame: '#4A4232',
      tints: ['#1C1915', '#1C1915', '#1C1915'],
    },
    fonts: {
      ...inter,
      display: 'PlayfairDisplay_400Regular',
      label: 'Inter_500Medium',
      quote: 'PlayfairDisplay_400Regular_Italic',
      button: 'Inter_500Medium',
    },
    displayCaps: false,
    labelCaps: true,
    labelSpacing: 3,
    buttonCaps: true,
    radius: 2,
    card: 'line',
    quote: 'plain',
    goalIcon: 'none',
    decor: 'none',
    tagline: 'none',
    romanDays: false,
  },
  {
    id: 'hustle',
    name: 'Hustle',
    group: 'everyday',
    blurb: 'Black and electric lime',
    dark: true,
    colors: {
      bg: '#0A0A0A',
      card: '#1A1A1A',
      field: '#1A1A1A',
      border: '#2A2A2A',
      text: '#F5F5F5',
      muted: '#8C8C8C',
      accent: '#C6FF3D',
      onAccent: '#0A0A0A',
      label: '#8C8C8C',
      tabInactive: '#555555',
      frame: '#C6FF3D',
      tints: ['#1A1A1A', '#1A1A1A', '#1A1A1A'],
    },
    fonts: {
      ...inter,
      display: 'ArchivoBlack_400Regular',
      label: 'Inter_500Medium',
      quote: 'Inter_500Medium',
      button: 'Inter_500Medium',
    },
    displayCaps: true,
    labelCaps: false,
    labelSpacing: 0,
    buttonCaps: true,
    radius: 12,
    card: 'filled',
    quote: 'bar',
    goalIcon: 'none',
    decor: 'none',
    tagline: 'streak',
    romanDays: false,
  },
];

export function getTheme(id: string) {
  return themes.find((t) => t.id === id) ?? themes[0];
}
