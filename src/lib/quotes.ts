/**
 * A quote to read on the way in: a new one each time the app opens.
 *
 * Each one was checked against its book or talk (Oct 2026); misattributed and unsourced lines were
 * dropped or reworded to the original. Add more only once they're traced to a source.
 */
export type Quote = { text: string; who: string };

export const QUOTES: Quote[] = [
  // Neville Goddard
  { text: 'Assume the feeling of your wish fulfilled.', who: 'Neville Goddard' },
  { text: 'An assumption, though false, if persisted in will harden into fact.', who: 'Neville Goddard, quoting Anthony Eden' },
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
  { text: 'Change the way you look at things, and the things you look at change.', who: 'Wayne Dyer' },
  // Louise Hay
  { text: 'Every thought we think is creating our future.', who: 'Louise Hay' },
  // Abraham Hicks
  { text: 'A belief is only a thought you continue to think.', who: 'Abraham Hicks' },
  // Bob Proctor
  { text: 'If you see it in your mind, you’re going to hold it in your hand.', who: 'Bob Proctor' },
  // Napoleon Hill
  { text: 'Whatever the mind of man can conceive and believe, it can achieve.', who: 'Napoleon Hill' },
  // Earl Nightingale
  { text: 'We become what we think about.', who: 'Earl Nightingale' },
  // James Allen
  { text: 'Dream lofty dreams, and as you dream, so shall you become.', who: 'James Allen' },
  { text: 'Men do not attract that which they want, but that which they are.', who: 'James Allen' },
  { text: 'Circumstance does not make the man; it reveals him to himself.', who: 'James Allen' },
  // Marcus Aurelius
  { text: 'Our life is what our thoughts make it.', who: 'Marcus Aurelius' },
  // Spiritual teachers and writers
  { text: 'The world without is a reflection of the world within.', who: 'Charles Haanel' },
  { text: 'A thought, in this substance, produces the thing that is imaged by the thought.', who: 'Wallace Wattles' },
  { text: 'And, when you want something, all the universe conspires in helping you to achieve it.', who: 'Paulo Coelho' },
  {
    text: 'Our deepest fear is not that we are inadequate. Our deepest fear is that we are powerful beyond measure.',
    who: 'Marianne Williamson',
  },
  { text: 'Inherent in every intention and desire is the mechanics for its fulfillment.', who: 'Deepak Chopra' },
  { text: 'Realize deeply that the present moment is all you have.', who: 'Eckhart Tolle' },
  {
    text: 'There is nothing more important to true growth than realizing that you are not the voice of the mind—you are the one who hears it.',
    who: 'Michael Singer',
  },
  { text: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.', who: 'Alan Watts' },
  {
    text: 'If you follow your bliss, you put yourself on a kind of track that has been there all the while, waiting for you.',
    who: 'Joseph Campbell',
  },
  { text: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.', who: 'Thich Nhat Hanh' },
  { text: 'Knowing others is intelligence; knowing yourself is true wisdom.', who: 'Lao Tzu' },
  { text: 'The journey of a thousand miles starts from beneath your feet.', who: 'Lao Tzu' },
  { text: 'Out beyond ideas of wrongdoing and rightdoing, there is a field. I’ll meet you there.', who: 'Rumi' },
  {
    text: 'The game of life is a game of boomerangs. Our thoughts, deeds and words return to us sooner or later, with astounding accuracy.',
    who: 'Florence Scovel Shinn',
  },
  { text: 'Nothing can bring you peace but yourself.', who: 'Ralph Waldo Emerson' },
  { text: 'Trust thyself: every heart vibrates to that iron string.', who: 'Ralph Waldo Emerson' },
];

/** Picked once when the app loads, so it changes each time you open it, not each time you go Home. */
export const quoteOfThisVisit: Quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
