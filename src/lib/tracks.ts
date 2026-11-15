import type { IconName } from '@/components/ui';
import type { Affirmation, TrackEdit } from '@/lib/types';

/*
 * Ready-made affirmation tracks for what most people come in to manifest, 20 lines each, all written in
 * Chris's style: mostly spoken to "you" with a few "I" lines, "why" questions that assume it's true,
 * sensory moments, "free from", and a closing "It's done." (see docs/affirmation-guide.md). They play in the Listen tab
 * like a goal's own tape (spoken or subliminal), in the calm or deep voice. Each line's audio is made
 * the first time it's played and kept, so a track only costs anything once.
 */
export type Track = {
  id: string;
  title: string;
  about: string;
  icon: IconName;
  lines: string[];
  /** Combined tracks only: each line's id in the track it came from, and those tracks. */
  lineIds?: string[];
  parts?: Track[];
};

/** Explore's intention groups, in order, with the tracks in each. */
export const TRACK_GROUPS: { id: string; label: string; tracks: string[] }[] = [
  { id: 'money', label: 'Money & success', tracks: ['money-magnet', 'success', 'career', 'luck'] },
  { id: 'self', label: 'Love & self', tracks: ['confidence', 'self-love', 'love', 'glow-up'] },
  { id: 'calm', label: 'Calm & sleep', tracks: ['calm', 'sleep', 'gratitude'] },
  { id: 'body', label: 'Body & mind', tracks: ['health', 'focus'] },
];

export const TRACKS: Track[] = [
  {
    id: 'money-magnet',
    title: 'Money & abundance',
    about: 'Money, wealth and more than enough',
    icon: 'cash-outline',
    lines: [
      'Money finds you so easily now, you barely notice it arriving.',
      'Why does money keep showing up for you like this?',
      'Every time you check your account, you smile at how much it’s grown.',
      'You have so much money you have to figure out what to do with it all.',
      'Why does everything you touch seem to multiply?',
      'Your wealth keeps growing, quietly and constantly, even while you sleep.',
      'You’ve always been good with money, and now it’s obvious to everyone.',
      'Payments, gifts and opportunities keep landing in your lap, sometimes out of nowhere.',
      'You pay for things without even looking at the price, and it feels so normal.',
      'Why do you always have more than enough? It feels amazing.',
      'You spend with joy, because you know more is already on the way.',
      'You give generously, and it comes back to you bigger every time.',
      'I am a money magnet, and it’s only getting stronger.',
      'Being rich feels natural to you now, like it was always this way.',
      'You’re free from ever worrying about money again.',
      'New income keeps flowing in from places you never expected.',
      'I deserve this wealth, because I bring real value everywhere I go.',
      'You get to choose where to travel, what to build and who to bless.',
      'You’re so grateful for how effortlessly money flows to you.',
      'It’s done. You are wealthy, and money is simply part of who you are.',
    ],
  },
  {
    id: 'success',
    title: 'Success',
    about: 'Win at what you do',
    icon: 'trophy-outline',
    lines: [
      'You win so often now that it barely surprises you.',
      'Why does everything you work on turn into a success?',
      'Doors keep opening for you before you even knock.',
      'You finish what you start, and people notice.',
      'Your results speak louder than anything you could ever say.',
      'You’ve always had it in you. Now the whole world can see it.',
      'Why do the right people and the right chances keep finding you?',
      'You’re proud of how far you’ve come, and you’re still rising.',
      'Success feels natural to you, like you were born for it.',
      'You hit milestones so fast you keep having to set bigger ones.',
      'Every time you look at what you’ve built, you can’t help but smile.',
      'I succeed because I keep showing up, and I always will.',
      'People come to you for advice now, because you’ve done it.',
      'You make hard things look easy, and it’s honestly impressive.',
      'Why does winning feel so normal to you these days?',
      'You’re free from doubting yourself. You just move.',
      'The wins keep stacking up, faster and faster.',
      'I am exactly the kind of person who makes it.',
      'You’re so grateful for every win, and there’s always another coming.',
      'It’s done. You are the success you used to dream about.',
    ],
  },
  {
    id: 'confidence',
    title: 'Confidence',
    about: 'Walk in like you own it',
    icon: 'flash-outline',
    lines: [
      'You walk into every room like it was waiting for you.',
      'Why are you so comfortable being yourself? People can feel it.',
      'Your confidence is quiet, steady and impossible to ignore.',
      'You’ve stopped asking for permission to take up space.',
      'Other people’s opinions bounce right off you now.',
      'You trust yourself completely, and it shows in everything you do.',
      'Why does speaking up feel so easy for you these days?',
      'You love the person you’ve become, and you’re only getting started.',
      'You’ve always been meant to be this sure of yourself.',
      'When you catch your reflection, you like what you see.',
      'You hold eye contact easily, because you have nothing to hide.',
      'I am confident, and it feels completely natural.',
      'You’re free from needing anyone’s approval.',
      'Your voice is calm and clear, and people lean in to listen.',
      'Why do people trust you the moment they meet you?',
      'You make decisions fast, because you trust your gut.',
      'I back myself, every single time.',
      'Even on hard days, your confidence holds steady.',
      'You’re so proud of how naturally you carry yourself now.',
      'It’s done. Confidence is simply who you are.',
    ],
  },
  {
    id: 'self-love',
    title: 'Self-love',
    about: 'Be kind to yourself',
    icon: 'heart-circle-outline',
    lines: [
      'You love yourself so much now, it shows in everything you do.',
      'Why does being kind to yourself come so easily these days?',
      'You’re worthy of love, rest and every good thing.',
      'You give yourself the same patience you give everyone else.',
      'You’ve forgiven yourself, and it feels so light.',
      'Your body is your home, and you take care of it gently.',
      'You’ve always been enough, exactly as you are.',
      'I love and accept myself, fully.',
      'When you look in the mirror, you see someone you’re proud of.',
      'You grow at your own pace, and it’s perfect.',
      'Why do you feel so at peace with who you are?',
      'You’re free from the old voice that said you weren’t enough.',
      'You speak to yourself like your own best friend.',
      'I deserve the same love I give to others.',
      'You rest without guilt, because rest is part of loving yourself.',
      'Every day you like yourself a little more, and it feels amazing.',
      'You keep your promises to yourself, so you trust yourself completely.',
      'I am whole, and I am enough.',
      'You’re so grateful to finally be on your own side.',
      'It’s done. You love yourself, completely.',
    ],
  },
  {
    id: 'love',
    title: 'Love',
    about: 'Attract real love',
    icon: 'heart-outline',
    lines: [
      'You are so deeply loved, it fills every part of your life.',
      'Why does love come to you so easily?',
      'The person meant for you sees you and chooses you, every single day.',
      'You feel completely safe being loved.',
      'Your relationship is warm, honest and full of laughter.',
      'You’ve always been worthy of this kind of love.',
      'Why does being loved feel so natural to you now?',
      'You give love freely, and it comes back to you multiplied.',
      'Your heart is open, and love keeps walking right in.',
      'You wake up next to someone who adores you, and it still amazes you.',
      'They text you first, because you’re on their mind all day.',
      'I am loved deeply, loyally and out loud.',
      'You’re free from old heartbreak. It only made room for this.',
      'Every time they look at you, you can feel how much they mean it.',
      'Why is your love story this easy?',
      'You never have to chase love. It finds you.',
      'I attract love, because I am love.',
      'Your friends can see it: you’re glowing from being this loved.',
      'You’re so grateful for the love in your life, and it keeps growing.',
      'It’s done. You are loved exactly as you are.',
    ],
  },
  {
    id: 'health',
    title: 'Health & energy',
    about: 'Feel strong and well',
    icon: 'fitness-outline',
    lines: [
      'You wake up full of energy, ready before your alarm even goes off.',
      'Why do you feel this good, every single day?',
      'Your body is strong, healthy and naturally full of life.',
      'Every cell in your body is thriving.',
      'You love moving your body, and it loves you back.',
      'You choose food that makes you feel amazing, without even thinking about it.',
      'Your body heals quickly and easily.',
      'You sleep deeply and wake up refreshed.',
      'You’ve always had a strong body. Now you feel it every day.',
      'I am getting healthier every single day.',
      'You take the stairs and barely notice, because your energy just keeps going.',
      'Why does taking care of yourself feel so easy now?',
      'You’re free from feeling tired. You have energy to spare.',
      'You listen to your body, and give it exactly what it needs.',
      'I feel strong, light and alive.',
      'People keep telling you how healthy you look, and you can feel it too.',
      'Your body grows stronger every time you use it.',
      'I feel completely at home in my body.',
      'You’re so grateful for this body and everything it does for you.',
      'It’s done. You are healthy, strong and full of energy.',
    ],
  },
  {
    id: 'calm',
    title: 'Calm & peace',
    about: 'Let go of anxiety',
    icon: 'leaf-outline',
    lines: [
      'You are safe, and you are calm.',
      'You breathe in peace and breathe out tension.',
      'Why do you feel so calm lately, even on busy days?',
      'You let go of what you can’t control, and it feels so light.',
      'Your mind is quiet and clear, like still water.',
      'Everything is working out for you, and you know it.',
      'You handle whatever comes with ease.',
      'You’ve always had this calm inside you. Now you live in it.',
      'I am grounded, steady and relaxed.',
      'You’re free from worry. You choose trust instead.',
      'Your shoulders drop, your jaw softens, and your breath slows down.',
      'Why does peace come to you so naturally now?',
      'Peace is always there for you, one breath away.',
      'I release what I don’t need to carry.',
      'People feel calmer just being around you.',
      'Your body feels safe, settled and soft.',
      'Nothing has to be rushed. You have time.',
      'I am at peace with this moment, just as it is.',
      'You’re so grateful for how calm your life feels now.',
      'It’s done. You are at peace.',
    ],
  },
  {
    id: 'sleep',
    title: 'Deep sleep',
    about: 'Drift off easily',
    icon: 'moon-outline',
    lines: [
      'Your body is relaxed, heavy and warm.',
      'You let go of the day, gently and completely.',
      'Every breath carries you deeper into rest.',
      'Your mind is calm and quiet, like a still night.',
      'You are safe, warm and completely at rest.',
      'Everything can wait until morning.',
      'Why does sleep come to you so easily now?',
      'Your eyes feel heavy, and it feels so good.',
      'You sink into the bed, and the bed holds you.',
      'I drift easily into deep, peaceful sleep.',
      'Your thoughts slow down, softer and softer.',
      'You’re free from the day. There is nothing left to do.',
      'You’ve always known how to sleep deeply. Your body remembers.',
      'You sleep soundly, all through the night.',
      'I am safe, and I can rest now.',
      'Your body repairs and renews itself while you sleep.',
      'Every sound fades a little further away.',
      'You wake up rested, clear and ready.',
      'You’re so grateful for this quiet, and this rest.',
      'It’s done. You are sleeping deeply.',
    ],
  },
  {
    id: 'focus',
    title: 'Focus & discipline',
    about: 'Get it done',
    icon: 'locate-outline',
    lines: [
      'You’re focused, and your attention goes exactly where you choose.',
      'Why does getting things done feel so easy for you now?',
      'You do what you said you would do, every time.',
      'You show up every day, even when you don’t feel like it.',
      'Distractions have lost their pull on you.',
      'You finish what you start, and it feels amazing.',
      'You’ve always been capable. Now you’re unstoppable.',
      'I do the most important thing first.',
      'Once you start, you lock in, and time flies.',
      'Your habits are quietly building the life you’re creating.',
      'Why do you keep your promises to yourself so easily now?',
      'You’re free from putting things off. You just begin.',
      'Your phone stays face down, because the work is more interesting.',
      'I am disciplined, and it gets easier every day.',
      'Every small step you take adds up, and you can see it.',
      'People wonder how you get so much done.',
      'You love the feeling of crossing things off.',
      'I choose focus, because my future is worth it.',
      'You’re so proud of how consistent you’ve become.',
      'It’s done. You are focused and disciplined.',
    ],
  },
  {
    id: 'career',
    title: 'Dream career',
    about: 'Work you love, paid well',
    icon: 'briefcase-outline',
    lines: [
      'You do work you love, and you’re paid so well for it.',
      'Why do the best opportunities keep finding you?',
      'You’re recognized and rewarded for everything you bring.',
      'The right doors open for you at exactly the right time.',
      'You’re so confident in your skills, because you’ve earned them.',
      'You’ve always been meant for this work.',
      'You get offers you didn’t even apply for.',
      'I am a leader in my field, and it keeps growing.',
      'Your work makes a real difference, and people tell you so.',
      'Why does work feel this good?',
      'You wake up excited about your day.',
      'People love working with you, because you’re great at what you do.',
      'You’re free from work that drained you. That’s all behind you.',
      'Your income grows every year, easily and naturally.',
      'I get paid well for what I love.',
      'Your boss, your clients and your team all value you.',
      'Every year your career grows stronger.',
      'You’re exactly where you need to be, and you’re going further.',
      'You’re so grateful for work that feels like you.',
      'It’s done. You are living your dream career.',
    ],
  },
  {
    id: 'luck',
    title: 'Luck',
    about: 'Everything goes your way',
    icon: 'sparkles-outline',
    lines: [
      'You’re so lucky, people joke about it.',
      'Why do things always work out for you?',
      'You keep ending up in the right place at the right time.',
      'Unexpected wins find you almost every week.',
      'The universe is clearly on your side, and you know it.',
      'You’ve always been lucky. Lately it’s on a whole new level.',
      'Why do the best surprises keep happening to you?',
      'You expect good things, and good things keep coming.',
      'Life is rigged in your favor, and you love it.',
      'Even your detours turn into something better.',
      'You find parking and catch every green light, and it makes you laugh.',
      'I am lucky, and I always have been.',
      'Good news keeps arriving, faster than you can share it.',
      'You’re free from bad luck. It just doesn’t stick to you.',
      'Things that go wrong for others somehow go right for you.',
      'You win giveaways, deals and chances most people miss.',
      'I trust that everything is happening for me.',
      'Your luck feels effortless, like magic.',
      'You’re so grateful for how lucky you are.',
      'It’s done. Luck is just part of who you are.',
    ],
  },
  {
    id: 'glow-up',
    title: 'Glow up',
    about: 'Look and feel your best',
    icon: 'sunny-outline',
    lines: [
      'You’re glowing so much lately, people keep asking what changed.',
      'Why do you look better every single day?',
      'You love what you see in the mirror.',
      'Your skin, your energy and your style all feel like you.',
      'You take care of yourself, because you know you’re worth it.',
      'You’ve always been beautiful. Now you finally feel it.',
      'Why does feeling good in your body come so easily now?',
      'Your glow comes from the inside, and it lights up every room.',
      'You’re becoming the best version of yourself, and it shows.',
      'Your skin is clear, soft and glowing.',
      'Every photo of you comes out good now. It’s almost funny.',
      'I am magnetic, and people can feel it.',
      'You walk past a mirror and smile, every time.',
      'You’re free from comparing yourself. You’re your own standard.',
      'Your hair, your smile, your posture: everything just works.',
      'People do a double take when you walk by.',
      'I glow because I take care of myself, inside and out.',
      'Your confidence makes you even more beautiful.',
      'You’re so grateful for this glow up, and it keeps going.',
      'It’s done. You are glowing, and you know it.',
    ],
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    about: 'Notice what you have',
    icon: 'flower-outline',
    lines: [
      'You have so much to be thankful for, it fills your heart.',
      'Why does your life keep getting better?',
      'You notice the good in every day, even the small things.',
      'Your life is full of blessings, and more keep coming.',
      'You’ve always been taken care of, and you always will be.',
      'The morning light, a warm coffee, the people who love you: it’s all a gift.',
      'I am grateful for this day.',
      'Gratitude opens the door to more, and you keep it wide open.',
      'Why do good things keep finding you?',
      'You appreciate the people in your life, and they feel it.',
      'You’re thankful for your body, your mind and your heart.',
      'I already have so much.',
      'Every day gives you something new to be grateful for.',
      'You already have enough, and still more keeps coming.',
      'You say thank you often, and you mean it.',
      'Thank you for everything I have, and everything on its way.',
      'The more grateful you feel, the more you receive.',
      'Your heart feels full, warm and open.',
      'You’re so grateful, and it feels amazing.',
      'It’s done. Your life is full.',
    ],
  },
];

// Tracks that were folded into another one, so old saves and links still open.
const MERGED: Record<string, string> = { wealth: 'money-magnet' };

/** Track ids joined with "+" make a combined track, e.g. "money-magnet+luck". */
/** The built-in wording, kept so developer-mode edits can be undone. */
const ORIGINAL = new Map(TRACKS.map((t) => [t.id, { title: t.title, lines: [...t.lines] }]));

export const originalTrack = (id: string) => ORIGINAL.get(id);

/**
 * Developer mode: puts your own wording into the ready-made tracks, everywhere they're used, and puts
 * the built-in wording back for any track without an edit.
 */
export function applyTrackEdits(edits: Record<string, TrackEdit> | undefined) {
  for (const track of TRACKS) {
    const base = ORIGINAL.get(track.id)!;
    const edit = edits?.[track.id];
    const lines = edit?.lines.map((l) => l.trim()).filter(Boolean);
    track.title = edit?.title?.trim() || base.title;
    track.lines = lines?.length ? lines : [...base.lines];
  }
}

export const comboId = (ids: string[]) => ids.join('+');

/**
 * A ready-made track, or several played back to back as one. A combined track keeps only the last
 * part's closing "It’s done." line, so it ends once.
 */
export function trackById(id: string | undefined): Track | undefined {
  if (!id) return undefined;
  const ids = [...new Set(id.split('+').map((part) => MERGED[part] ?? part))];
  const parts = ids.map((part) => TRACKS.find((t) => t.id === part)).filter((t): t is Track => !!t);
  if (parts.length <= 1) return parts[0];
  const lines = parts.flatMap((part) => part.lines.map((text, i) => ({ text, id: `track-${part.id}-${i}` })));
  const keep = lines.filter((l, i) => i === lines.length - 1 || !isClosing(l.text));
  return {
    id: comboId(parts.map((t) => t.id)),
    title: parts.map((t) => t.title).join(' + '),
    about: 'Combined',
    icon: parts[0].icon,
    lines: keep.map((l) => l.text),
    lineIds: keep.map((l) => l.id),
    parts,
  };
}

export const isClosing = (text: string) => /^It[’']s done\b/.test(text);

/** A track's lines as affirmations the player understands. The ids stay the same between visits. */
export function trackAffirmations(track: Track): Affirmation[] {
  return track.lines.map((text, i) => ({
    id: track.lineIds?.[i] ?? `track-${track.id}-${i}`,
    text,
    mine: false,
    favorite: false,
    createdAt: 0,
  }));
}
