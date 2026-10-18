/**
 * A quote to read on the way in: a new one each time the app opens.
 *
 * Only quotes we're confident are the speaker's own words. Popular misattributions are left out
 * rather than guessed at. Add more by sending them in; keep the attribution honest.
 */
export type Quote = { text: string; who: string };

export const QUOTES: Quote[] = [
  // Neville Goddard
  { text: 'Assume the feeling of your wish fulfilled.', who: 'Neville Goddard' },
  { text: 'An assumption, though false, if persisted in will harden into fact.', who: 'Neville Goddard' },
  { text: 'Change your conception of yourself and you will automatically change the world in which you live.', who: 'Neville Goddard' },
  { text: 'Dare to believe in the reality of your assumption and watch the world play its part relative to its fulfillment.', who: 'Neville Goddard' },
  { text: 'Prayer is the art of assuming the feeling of being and having that which you want.', who: 'Neville Goddard' },
  { text: 'Feeling is the secret.', who: 'Neville Goddard' },
  { text: 'Live in the end.', who: 'Neville Goddard' },
  // Joe Dispenza
  { text: 'Your personality creates your personal reality.', who: 'Dr. Joe Dispenza' },
  { text: 'Where you place your attention is where you place your energy.', who: 'Dr. Joe Dispenza' },
  { text: 'If you want a new outcome, you will have to break the habit of being yourself.', who: 'Dr. Joe Dispenza' },
  // Joseph Murphy
  { text: 'Your subconscious mind does not argue with you. It accepts what your conscious mind decrees.', who: 'Joseph Murphy' },
  // Florence Scovel Shinn
  { text: 'Faith knows it has already received and acts accordingly.', who: 'Florence Scovel Shinn' },
  // Wayne Dyer
  { text: 'You’ll see it when you believe it.', who: 'Wayne Dyer' },
  { text: 'If you change the way you look at things, the things you look at change.', who: 'Wayne Dyer' },
  // Louise Hay
  { text: 'Every thought we think is creating our future.', who: 'Louise Hay' },
  // Abraham Hicks
  { text: 'A belief is only a thought you keep thinking.', who: 'Abraham Hicks' },
  // Bob Proctor
  { text: 'If you can see it in your mind, you can hold it in your hand.', who: 'Bob Proctor' },
  // Napoleon Hill
  { text: 'Whatever the mind of man can conceive and believe, it can achieve.', who: 'Napoleon Hill' },
  // Earl Nightingale
  { text: 'We become what we think about.', who: 'Earl Nightingale' },
  // James Allen
  {
    text: 'You are today where your thoughts have brought you; you will be tomorrow where your thoughts take you.',
    who: 'James Allen',
  },
  // Henry Ford
  { text: 'Whether you think you can, or you think you can’t, you’re right.', who: 'Henry Ford' },
  // Marcus Aurelius
  { text: 'Our life is what our thoughts make it.', who: 'Marcus Aurelius' },
];

/** Picked once when the app loads, so it changes each time you open it, not each time you go Home. */
export const quoteOfThisVisit: Quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
