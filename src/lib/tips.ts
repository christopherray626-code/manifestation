import { localDay } from '@/lib/today';

/*
 * A short tip on Today, a new one each day, and the "Why it works" notes around the app. They teach a
 * little about manifestation without turning the app into a course. Grounded in the practices the app's
 * writing follows (docs/affirmation-guide.md); the wording stays honest about what is tradition and
 * what is research.
 */

export type Tip = { title: string; body: string };

export const TIPS: Tip[] = [
  {
    title: 'Speak from the end',
    body: 'Say it as if it’s already happened. Neville Goddard called this living in the end: you don’t chase the wish, you think from it.',
  },
  {
    title: 'Feeling is the secret',
    body: 'The words matter less than the feeling behind them. As you listen, let yourself feel the relief and gratitude of already having it.',
  },
  {
    title: 'Listen as you fall asleep',
    body: 'The drowsy minutes before sleep are when the mind is most open to suggestion. Put on a subliminal with a timer and drift off to it.',
  },
  {
    title: 'Hearing “you” helps',
    body: 'In a 2014 study, people who coached themselves as “you” did better than those who said “I”. That’s why many of your lines speak to you like a friend.',
  },
  {
    title: 'Why questions work on you',
    body: '“Why does money come so easily to me?” Your mind goes looking for answers, and the question quietly assumes it’s already true.',
  },
  {
    title: 'Repetition makes it familiar',
    body: 'Things we hear again and again start to feel true. That’s why a tape repeats the same lines: familiarity becomes belief.',
  },
  {
    title: 'Make it believable',
    body: 'If a line feels like a lie, your mind argues with it. Lines like “I am becoming…” are a bridge. Use them until the bigger ones feel natural.',
  },
  {
    title: 'Picture it in detail',
    body: 'Small real moments beat big ideas. The keys in your hand, the notification saying it cleared. The more you can see it, the more you feel it.',
  },
  {
    title: 'Say what you want',
    body: 'Write “I am calm”, not “I’m not anxious”. The mind latches onto the key word, so make it the one you want.',
  },
  {
    title: 'Act as if',
    body: 'Do one small thing today the version of you who already has it would do. Behaviour is how a belief becomes real.',
  },
  {
    title: 'Let go of the how',
    body: 'Decide what, feel it as done, and let the how surprise you. Checking every hour whether it’s arrived tells your mind it hasn’t.',
  },
  {
    title: 'Gratitude first',
    body: 'Thank yourself for it before it shows up. Gratitude is the feeling of having, and that’s the feeling to live in.',
  },
  {
    title: 'Persist',
    body: 'Neville taught that an assumption, persisted in, hardens into fact. One listen is a nudge; a daily listen is a new normal.',
  },
  {
    title: 'Your own voice is powerful',
    body: 'Recording your affirmations in your own voice means your mind hears them the way it hears your own thoughts.',
  },
  {
    title: 'Use headphones for beats',
    body: 'Binaural beats only work with headphones: each ear gets a slightly different tone, and your brain hears the difference as a slow pulse.',
  },
  {
    title: 'Revise the day',
    body: 'Before sleep, replay anything that went wrong today the way you wish it had gone. Neville called this revision.',
  },
  {
    title: 'Watch your self-talk',
    body: 'The tape is ten minutes; your thoughts run all day. Catch one old thought today and swap it for one of your affirmations.',
  },
  {
    title: 'Identity over outcome',
    body: '“I am the kind of person who…” makes it who you are, and the habits follow. Outcomes come from identity.',
  },
  {
    title: 'Relax into it',
    body: 'Effort and strain say “I don’t have it.” Listen lying down, breathe slowly, and let the words wash over you.',
  },
  {
    title: 'Small proof counts',
    body: 'Notice the small signs today and say thank you for each one. What you notice grows.',
  },
  {
    title: 'Morning sets the tone',
    body: 'Hear your affirmation before your phone fills your head with everyone else’s. Even one line in the morning steers the day.',
  },
];

/** Today's tip: a new one each day, the same all day. */
export function tipOfTheDay(now = Date.now()) {
  return TIPS[localDay(now) % TIPS.length];
}

/** The short "Why it works" notes, by where they appear. */
export const WHY = {
  spoken:
    'Hearing your affirmations clearly and often makes them familiar, and familiar things start to feel true. Listen when you’re relaxed, and feel each line as it lands.',
  subliminal:
    'The words sit far below the music, so the part of you that argues never gets a chance. It’s most powerful as you drift off to sleep, when the mind is most open.',
  frequencies:
    'Solfeggio tones are a sound-healing tradition, each linked with a different intention. Binaural beats play a slightly different tone in each ear, which many people find relaxes the mind into a dreamier state. Use headphones.',
  voices:
    'A calm, warm voice helps you relax, and a relaxed mind takes words in more easily. Your own voice is the most familiar of all: it sounds like your own thoughts.',
  presentTense:
    'Write it as already yours. The mind argues with “I want”, because wanting means not having. “I have” and “I am” leave nothing to argue with.',
  youAndWhy:
    'Lines that speak to you as “you” feel like a friend who believes in you. “Why” questions assume it’s already true and send your mind looking for proof.',
};
