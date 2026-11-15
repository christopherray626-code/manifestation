# Subliminal-maker and subliminal-audio apps on iOS and Google Play (as of 14 Nov 2026)

Method: iTunes lookup API for every listed id plus 11 extra apps found with the iTunes Search API (`term=subliminal`, `term=subliminal maker`); in-app purchase (IAP) price lists scraped from each US App Store page (apps.apple.com/us/app/id<ID>); Google Play search for "subliminal", "subliminal maker", "subliminal affirmations" and "custom subliminal", then each Play details page (installs, rating, review count, last update). Ratings counts are US App Store only. "Sublime: Subliminals" (id6817551957) is excluded as instructed. Every feature claim below comes from the developer's own store description, so it is marketing copy, not verified behaviour.

Source URL patterns used below:
- AS-lookup = `https://itunes.apple.com/lookup?id=<ID>&country=us`
- AS-page = `https://apps.apple.com/us/app/id<ID>` (IAP list)
- GP = `https://play.google.com/store/apps/details?id=<package>&hl=en&gl=US`

## Per-app profiles

### Takeaway
About 30 apps in this niche exist; most "subliminal makers" launched in 2025-2026 and have under 100 US ratings. The only ones with real traction are library apps (Sound & Soulful, 1,767 ratings; iMobLife, 445) and two makers: VibeSesh (1,747 iOS ratings, 10K+ Android installs) and Decrétalo (148 iOS ratings, 10K+ Android installs). Innertune (100K+ Play installs) and MegaBit Subliminal Messages Lite (100K+) are the biggest Android names, but they sit next to the category rather than being audio subliminal makers.

### Cited Findings

#### Makers (user-created subliminal audio)

**VibeSesh - Subliminal Maker** (Soul Surferz, LLC; iOS id6746336493; Android com.attilax0.vibeseshapp)
- Released 6 Jun 2025, v1.3.0 updated 1 Oct 2026, Lifestyle, 4.64 stars from 1,747 US ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6746336493&country=us)
- Android: 10K+ installs, 4.4 stars, 2.31K reviews, updated 30 Aug 2026 — [GP](https://play.google.com/store/apps/details?id=com.attilax0.vibeseshapp&hl=en&gl=US)
- Features: "full transparency" (you can read every affirmation), 150+ ready-made tracks, AI-generated custom affirmations, own-voice recording or "natural text-to-speech", background audio from Spotify playlists, YouTube videos or built-in sounds, separate volume for voice and background, sleep timer, gapless looping. The library and player need a subscription — [AS-lookup](https://itunes.apple.com/lookup?id=6746336493&country=us)
- IAPs: many "Unlimited" tiers at $4.99, $9.99, $12.99, $19.99, $29.99, $49.99 and $149.99, plus "VibeSesh - Custom Subliminals" at $12.99. The store does not say which period each tier is — [AS-page](https://apps.apple.com/us/app/id6746336493)
- Marketing: subreddit r/VibeSeshapp, Product Hunt, Instagram, X, Pinterest, plus SEO landing pages such as /subliminal-for-money/millionaire-mindset and /subliminal-maker/free — [vibeseshapp.com](https://www.vibeseshapp.com/)
- Download estimates disagree: MWM says "< 1k" US App Store downloads (not credible next to 1.7K ratings) — [mwm.ai](https://mwm.ai/apps/id/6746336493); AppBrain says about 15K total Android installs and 1.5K in the last 30 days — [AppBrain](https://www.appbrain.com/app/vibesesh-subliminal-maker/com.attilax0.vibeseshapp); AppstoreSpy gives no revenue figure — [AppstoreSpy](https://appstorespy.com/android-google-play/com.attilax0.vibeseshapp-trends-revenue-statistics-downloads-ratings)

**Sublimind: Custom Subliminals** (BRIGHT CODE HOLDINGS S.R.L., Romania; iOS id6742783610; Android digital.brightcode.sublimind)
- Released 1 Jun 2025, v3.0.5 updated 11 Nov 2026, 0 US ratings shown — [AS-lookup](https://itunes.apple.com/lookup?id=6742783610&country=us)
- Android: 10K+ installs, 4.0 stars, 28 reviews, updated 11 Nov 2026 — [GP](https://play.google.com/store/apps/details?id=digital.brightcode.sublimind&hl=en&gl=US)
- Features: you describe a goal and answer optional questions, and it writes a personalised affirmation script for free, which you can edit line by line. Three track intensities: Standard (15 min), Strong (30 min) and Max (60 min, "around 1,500 affirmations across six voice layers"). Backgrounds: ocean, forest, singing bowls, warm chords, plus optional "soft, rhythmic tones" matched to the goal. Free ready-made library, playlists, offline downloads, repeat, sleep timer with fade-out, reminders, listening time and streaks, a journal with personalised prompts, in-app guides — [AS-lookup](https://itunes.apple.com/lookup?id=6742783610&country=us)
- Pricing model: the library and script drafting are free. A subscription gives unlimited Standard tracks, one Strong track every 24 hours and one Max track every 7 days — [AS-lookup](https://itunes.apple.com/lookup?id=6742783610&country=us)
- IAPs: Weekly $7.99, Monthly $9.99, Yearly $49.99 or $59.99, "1 Custom Subliminal Generation" $29.99, "3 Custom Subliminal Generations" $69.99 — [AS-page](https://apps.apple.com/us/app/id6742783610)

**Subliminal Maker - Decrétalo** (Epicurist Labs, Inc on iOS / 3 Comma Studio LLC on Android; iOS id6776760425; Android com.decretalo.app)
- Released 20 Jun 2026, v1.8.24 updated 7 Oct 2026, 4.72 stars from 148 US ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6776760425&country=us)
- Android: 10K+ installs, 4.8 stars, 1.28K reviews — [GP](https://play.google.com/store/apps/details?id=com.decretalo.app&hl=en&gl=US)
- Features: AI-generated first-person "memory from your future" narrations from a goal you describe, unlimited custom audios, a ready-made library with weekly additions, synced read-along text, short 2-4 minute sessions. This is closer to scripting or visualisation than masked subliminals — [AS-lookup](https://itunes.apple.com/lookup?id=6776760425&country=us)
- IAPs: Weekly $5.99, Monthly $12.99, Annual $29.99 or $39.99 — [AS-page](https://apps.apple.com/us/app/id6776760425)
- MWM estimate: "8k+ downloads", 432 total ratings, which suggests a worldwide count (the Spanish name points to a Latin American audience) — [mwm.ai](https://mwm.ai/apps/id/6776760425)

**SelfMade (Subliminal Maker - SelfMade)** (James Vu, solo developer; iOS id6766178146; not found on Google Play)
- Released 3 Jun 2026, v1.2.19 updated 11 Nov 2026, 4.68 stars from 60 ratings, requires iOS 18 — [AS-lookup](https://itunes.apple.com/lookup?id=6766178146&country=us)
- Features: own-voice recording is the pitch (the app is aimed at Neville Goddard practitioners), a library of expert scripts, AI script writing, backgrounds (rain, ocean, river, forest, fireplace, white or pink noise) plus a frequency layer (theta 6 Hz, alpha 10 Hz, delta 2 Hz, 528 Hz, Schumann 7.83 Hz). Three modes, Subliminal, Supraliminal and SATS, each with its own voice slider and separate sound and frequency sliders. Sleep timer and seamless looping, "manifestation velocity tracking" (days to manifestation), archetypes, sealed letters to your future self, "voice verification on every track". The voice stays on the device and letters are encrypted. No ads — [AS-lookup](https://itunes.apple.com/lookup?id=6766178146&country=us)
- Free tier is the first subliminal. Premium unlocks unlimited subliminals, the script library and the Supraliminal/SATS modes — [AS-lookup](https://itunes.apple.com/lookup?id=6766178146&country=us)
- IAPs: Weekly $4.99, Monthly $9.99, Yearly $39.99, Lifetime $79.99 — [AS-page](https://apps.apple.com/us/app/id6766178146)

**ProgramU: Subliminal Studio** (ProgramU LLC; iOS id6767283547; Android com.programu.app)
- Released 7 Aug 2026, v1.0.13 updated 2 Nov 2026, 5.0 stars from 8 ratings, 248 MB, adults 18+ — [AS-lookup](https://itunes.apple.com/lookup?id=6767283547&country=us)
- Android: 100+ installs, 4.6 stars — [GP](https://play.google.com/store/apps/details?id=com.programu.app&hl=en&gl=US)
- Features: you type what you want to change and it writes and voices the session. Four session types: subliminals, guided meditation, guided hypnosis and EFT tapping. You see every line before it plays. Subliminals can be layered under your own music, a podcast or a show. Voiced by "a cast of studio-quality voices" or **your own cloned voice** (subliminals only). "ReflectU": an AI coach called Kaion, by voice or text, who designs sessions with you. A full Archive library, a 90-day program in three phases, "CollectiveU" live group sessions twice a day, instant resets, a time-capsule letter, streaks and a **home-screen widget** — [AS-lookup](https://itunes.apple.com/lookup?id=6767283547&country=us)
- Pricing model: the first session is free. Full Access has a 3-day free trial with 10 credits, and monthly credits pay for sessions and coach chats — [AS-lookup](https://itunes.apple.com/lookup?id=6767283547&country=us)
- IAPs: Full Access $19.99 (monthly) and $199.99 (annual); credit packs: 5 for $4.99, 12 for $9.99, 25 for $12.99 or $19.99, 50 for $24.99, 100 for $39.99 — [AS-page](https://apps.apple.com/us/app/id6767283547)

**JustSubly** (JUSTSUBLY PTY LTD, Australia; iOS id6782797650 "JustSubly: Subliminal Maker"; Android com.justsubly.app "JustSubly: Subliminal Tracker")
- Released 16 Jul 2026, v1.4.1 updated 11 Nov 2026, 4.64 stars from 11 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6782797650&country=us); Android 100+ installs, 4.6 stars — [GP](https://play.google.com/store/apps/details?id=com.justsubly.app&hl=en&gl=US)
- Features: search "thousands" of subliminal tracks or upload your own audio (several at once), playlists including community playlists, a maker (type or import affirmations, or let AI draft them), own voice or **ten AI voices**, layering over rain, ocean, lofi, piano or your own audio, a frequency tone, **speed and echo controls**, whisper-quiet voice. Drafts can be re-edited. Pro adds stacking up to 10 sounds at once, each with its own speed, volume and loop, and up to four layers per sub. Background playback with lock-screen controls, sleep timer, "affirmation rain" (your words drift across the screen), three affirmation notifications a day, a daily word-search game, vision boards, challenges and streaks with badges from 3 to 100 days, circles with group chat, polls and a leaderboard, listening parties (synced playback), and sending a playlist to another user by username — [AS-lookup](https://itunes.apple.com/lookup?id=6782797650&country=us)
- Pricing model: a "Whispers" credit balance pays for creating. It refreshes monthly, Pro gets 60 a month, and top-ups are possible. Pro has a 7-day free trial and includes offline caching, history, mood notes, a diary and themes — [AS-lookup](https://itunes.apple.com/lookup?id=6782797650&country=us)
- IAPs: JustSubly Pro $2.99 and $26.90 (probably monthly and yearly; the periods are not shown); Whispers 20 for $1.99, 60 for $3.99, 160 for $9.99 — [AS-page](https://apps.apple.com/us/app/id6782797650)

**Whispurry: Subliminal Audio** (Adrian Gaspar; iOS id6753062688; not found on Google Play)
- Released 4 Nov 2025, v3.2.5 updated 20 Apr 2026, 4.65 stars from 55 ratings, requires iOS 18.2 — [AS-lookup](https://itunes.apple.com/lookup?id=6753062688&country=us)
- Features: type affirmations, choose a background, and a "high-quality synthetic voice" is "algorithmically layered beneath" music or ambient sound. Transparency is the selling point. The listing has a short feature list — [AS-lookup](https://itunes.apple.com/lookup?id=6753062688&country=us)
- IAPs: Premium Monthly $12.99; credits 5,000 for $4.99, 35,000 for $14.99, 120,000 for $39.99 (credits likely charged per character or generation) — [AS-page](https://apps.apple.com/us/app/id6753062688)

**Hopium: Subliminal Maker** (Simon Petrov; iOS id6740145758) — extra find
- Released 26 Mar 2025, updated 22 Sep 2026, 4.28 stars from 36 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6740145758&country=us)
- Features: own voice or AI text-to-speech, layered audio, an archive, playback in the background while locked or in TikTok, Instagram, YouTube or Netflix. Effects: "silent subliminals", "speed reading affirmations", multi-voice layering, "harmonic aura processing". Ambient sounds (rain, thunder, ocean, white or pink noise), binaural beats, delta/theta/alpha, solfeggio 396/417/639 Hz. Also "discovering" subliminals, which suggests a community or library — [AS-lookup](https://itunes.apple.com/lookup?id=6740145758&country=us)
- IAPs: Monthly $9.99, Annual $39.99 — [AS-page](https://apps.apple.com/us/app/id6740145758)

**Whisperloop - Subliminal Maker** (Bitter Works LLC on iOS / "acrata" on Android; iOS id6751143251; Android com.acrata.brainloop) — extra find
- Released 25 Aug 2025, updated 20 Sep 2026, 4.24 stars from 17 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6751143251&country=us); Android 1K+ installs, 4.5 stars — [GP](https://play.google.com/store/apps/details?id=com.acrata.brainloop&hl=en&gl=US)
- Features: own voice or "a clean whisper voice", instant looping with no rendering step, subtle soundscapes, listening time and streaks, templates, no account, a minimal interface. It openly says subliminal audio "is not a proven method". Everything needs a subscription, with a 3-day trial — [AS-lookup](https://itunes.apple.com/lookup?id=6751143251&country=us)
- IAPs: $1.99, $8.99, $49.99 (weekly, annual, and probably a third tier) — [AS-page](https://apps.apple.com/us/app/id6751143251)

**Quency: Subliminal Creator** (Janek Buntkowski; iOS id6759976812) — extra find
- Released 24 Apr 2026, 1 rating — [AS-lookup](https://itunes.apple.com/lookup?id=6759976812&country=us)
- Features: affirmations "encoded at 20kHz using frequency modulation" (a silent-subliminal technique), played live under Spotify, YouTube or podcasts, "neural voices that sound human", playlists with cover images, sleep timer, streaks, XP across 7 life areas — [AS-lookup](https://itunes.apple.com/lookup?id=6759976812&country=us)

**CosmosTune: AI Manifestation** (CosmosTune Ltd; iOS id6752117225) — extra find
- Released 17 Nov 2025, updated 9 Nov 2026, 4.59 stars from 34 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6752117225&country=us)
- Features: subliminal affirmations play under TikTok, Spotify and Netflix. An onboarding quiz builds a plan: goal-specific affirmations, a "subliminal level from gentle to deep", a curated library and goal-matched frequencies. Claims "100,000+ affirmations & subliminals across 360+ life areas" — [AS-lookup](https://itunes.apple.com/lookup?id=6752117225&country=us)
- IAPs: Premium $12.99 and $69.99 — [AS-page](https://apps.apple.com/us/app/id6752117225)

**Subwave: Subliminal & Manifest** (Subwave LLC; iOS id6761197599; Android app.subwave.subwave_app) — extra find
- Released 16 Apr 2026, 2 ratings; Android 500+ installs — [AS-lookup](https://itunes.apple.com/lookup?id=6761197599&country=us), [GP](https://play.google.com/store/apps/details?id=app.subwave.subwave_app&hl=en&gl=US)
- Features: custom subliminal or audible affirmation tracks with solfeggio (432/528 Hz) and ambient sound, loops, a teleprompter for speaking affirmations, the 369 method with digital ink, a 68-second timer with haptics, **AI "manifestation songs"** (affirmations turned into full songs), a future diary turned into audio, vision board — [AS-lookup](https://itunes.apple.com/lookup?id=6761197599&country=us)
- IAPs: Weekly $4.99, Monthly $12.99, Quarterly $29.99, Annual $39.99 or $59.99 — [AS-page](https://apps.apple.com/us/app/id6761197599)

**SubliminalGen: Psyche AI** (Psyche AI LLC; iOS id6760197081)
- Released 21 Mar 2026, v1.3.0 updated 13 Nov 2026, 1 rating, Music category — [AS-lookup](https://itunes.apple.com/lookup?id=6760197081&country=us)
- Features: record your own affirmations, import audio, **AI music generation**, the Psyche music library, **play an Apple Music playlist alongside the affirmations**, several frequency layers with separate controls, loop length from 30 minutes to 8 hours, recommended mix presets (Subliminal: voice 5% / music 100%), tags. Premium covers AI music, advanced frequencies, the library and longer playback — [AS-lookup](https://itunes.apple.com/lookup?id=6760197081&country=us)
- IAPs: Gold Monthly $5.99 (offer $2.99), Gold Yearly $29.99, VIP Diamond Monthly $6.99, VIP Platinum Monthly $12.99 — [AS-page](https://apps.apple.com/us/app/id6760197081)

**SubCore: Binaural Affirmations** (Riccardo Barbatti; iOS id6751504616; Android com.upgrade.thesubcore "SubCore - Subliminal & Mantras")
- Released 27 Aug 2025, v3.1.8 updated 2 Jul 2026, 0 US ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6751504616&country=us); Android 100+ installs, 3.4 stars — [GP](https://play.google.com/store/apps/details?id=com.upgrade.thesubcore&hl=en&gl=US)
- Features: script and record in your own voice, binaural presets (delta to gamma), solfeggio 528/432/396 Hz, a frequency mixer with separate volumes, "subconscious-state notifications" (at sleep onset and on waking), routines and scheduling, vision board, silent mode, offline. Fully local: no account, no cloud sync, no tracking — [AS-lookup](https://itunes.apple.com/lookup?id=6751504616&country=us)
- No IAP list on the US App Store page, so it appears to be fully free on iOS — [AS-page](https://apps.apple.com/us/app/id6751504616)

**EmpowerMe: Subliminals & Hypno** (Nikita Gurbatov; iOS id6464066501)
- Released 12 Sep 2024, last update 13 Oct 2024 (v1.0.2), so it looks abandoned. 2 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6464066501&country=us)
- Features: AI writes 6 affirmations, own-voice recording, binaural beats and soundscapes, a subliminal-to-audio volume ratio, "hypno-alert" notifications, sleep playback. Uses NLP and CBT language — [AS-lookup](https://itunes.apple.com/lookup?id=6464066501&country=us)
- IAPs: Monthly $7.99, Annual $39.99 — [AS-page](https://apps.apple.com/us/app/id6464066501)

**Sublimidial** (Hanan Masiya; iOS id6746461473)
- Paid upfront ($4.99) and also a $4.99/month subscription per the description ($3.99 IAP listed). Released 3 Jul 2025, 3.33 stars from 3 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=6746461473&country=us), [AS-page](https://apps.apple.com/us/app/id6746461473)
- Features: **visual** subliminals (words or images flashed on screen at a "35ms" speed), adjustable text speed and colour, speech audio, own-voice recording, "Photonic Memory" for images and PDFs. A different product type (visual flashing) — [AS-lookup](https://itunes.apple.com/lookup?id=6746461473&country=us)

**Soularia: Subliminal Maker** (Soularia LLC; iOS id6752033221, $2.99 paid; Android com.soulariaApp) — extra find
- Released 6 Jun 2026, 5.0 from 6 ratings; Android 100+ installs — [AS-lookup](https://itunes.apple.com/lookup?id=6752033221&country=us), [GP](https://play.google.com/store/apps/details?id=com.soulariaApp&hl=en&gl=US)
- Features: own-voice recording and looping, calming background audio and frequencies, a daily ritual framing — [AS-lookup](https://itunes.apple.com/lookup?id=6752033221&country=us)

**Android-only makers** (found in Google Play search)
- Subtopia - Subliminal Maker (com.subtopia.subtopia_app): 1K+ installs, 3.2 stars, 21 reviews. Creator, audio stacking, "human-like AI text-to-speech", soundscapes and frequency layers, playlists, voice recording, audio import, loop controls, no ads. Pro adds advanced generation, goal tracking and **cloud backup** — [GP](https://play.google.com/store/apps/details?id=com.subtopia.subtopia_app&hl=en&gl=US)
- Subliminal Audio Creator (John R. Culbertson, com.johnculbertson.subliminalaudiocreator): 500+ installs, 3.9 stars. Text-to-speech or recorded voice layered over any audio file, **silent subliminals by high-frequency modulation**, self-hypnosis audio, "traditional or modern frequency shifting" — [GP](https://play.google.com/store/apps/details?id=com.johnculbertson.subliminalaudiocreator&hl=en&gl=US)
- SubliminalOS: Manifest & Shift (Awaken Monad, com.cyberfreak.subliminalos): 1K+ installs, 4.7 stars. Mostly a tracker: import MP3/WAV, record your voice, sessions, loops, listening time, streaks and goal tracking — [GP](https://play.google.com/store/apps/details?id=com.cyberfreak.subliminalos&hl=en&gl=US)
- Subliminal Studio: Maker (com.subliminalstudio.app): 100+ installs. Own voice only ("not text-to-speech"), takes up to 5 minutes, 30 prompts, voice volume 5-20%, offline, **no audio-file export**. Free plan: 1 session, rain and brown noise — [GP](https://play.google.com/store/apps/details?id=com.subliminalstudio.app&hl=en&gl=US)
- Also seen with low installs: Subliminals Mind (50+), Subliminal I AM (5+) — [GP](https://play.google.com/store/apps/details?id=com.subliminalsmind.app&hl=en&gl=US)

#### Libraries and affirmation players (mostly ready-made content)

**Sound & Soulful** (Sound & Soulful LLC; iOS id6444500896; Android com.allied.sns)
- Released 24 Mar 2023, v4.0.6 updated 23 Oct 2026, **4.87 stars from 1,767 US ratings**, Productivity category — [AS-lookup](https://itunes.apple.com/lookup?id=6444500896&country=us); Android 10K+ installs, 4.5 stars, 822 reviews, updated 13 Nov 2026 — [GP](https://play.google.com/store/apps/details?id=com.allied.sns&hl=en&gl=US)
- Features: 130+ in-house subliminals (appearance, mindset, money, body, relationships, spirituality), each in **8 background versions**, playlists, affirmations readable while listening. A creator-brand app (it also has a Shopify store) — [AS-lookup](https://itunes.apple.com/lookup?id=6444500896&country=us)
- Pricing (highest in the category): Monthly $19.99 ($17.99 if referred), 6 months $101.99, Yearly $179.99 — [AS-page](https://apps.apple.com/us/app/id6444500896)
- MWM estimate "1k+ downloads" (it does not say for what period; low next to its rating count) — [mwm.ai](https://mwm.ai/apps/id/6444500896)

**Subliminal Manifestation / "Subliminal: Daily Affirmations"** (iMobLife Inc.; iOS id531981452)
- Released 28 Jun 2012, v3.4.15 updated 13 Apr 2026, 4.10 stars from 445 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=531981452&country=us)
- Features: two sections, Subliminal and Affirmation. Dozens of topics, user stories, daily learning, your own collections, record your voice on repeat, daytime and bedtime reminders — [AS-lookup](https://itunes.apple.com/lookup?id=531981452&country=us)
- IAPs: a mix of subscriptions and single packs: Subliminal $7.99 and $48.99, Premium $25.99, a 1-week unlock $1.99, Be Positive 1-year $19.99, single topics (Law of Attraction, Attract Money, Weight Loss, Anxiety) $5.99 each — [AS-page](https://apps.apple.com/us/app/id531981452)
- No matching Google Play listing found under iMobLife in Play search (the Play search for "imoblife subliminal" returned only other apps) — [Play search](https://play.google.com/store/search?q=imoblife%20subliminal&c=apps)

**Subliminal daily affirmations** (Alisa Unzhakova / pinevalley.us; iOS id1354451796)
- Released 3 Mar 2018, last update 21 May 2020 (v1.3), so it is abandoned but still listed. 4.51 stars from 509 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=1354451796&country=us)
- Features: an edited list of affirmations, custom affirmations, "neuro-stimulating SFX & vibration", notifications — [AS-lookup](https://itunes.apple.com/lookup?id=1354451796&country=us)

**Powerful Subliminal Audio** (Daniel Karan / powerfulsubliminals.com; iOS id1545624545; Android com.molfario.powerfulsubliminals)
- Released 28 Jan 2021, v1.4.0 updated 17 Oct 2026, 4.32 stars from 75 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=1545624545&country=us); Android 10K+ installs, 3.5 stars, 132 reviews — [GP](https://play.google.com/store/apps/details?id=com.molfario.powerfulsubliminals&hl=en&gl=US)
- Features: an in-house library (confidence, money, weight loss, "Alpha Male/Female", gaming and so on) with "healing frequencies", a daily journal, playlists, favourites — [AS-lookup](https://itunes.apple.com/lookup?id=1545624545&country=us)
- IAPs: Monthly $9.99, Yearly $79.99, Lifetime $299.99 — [AS-page](https://apps.apple.com/us/app/id1545624545)

**ReliefMix Affirmations & Sleep** (Colton Grubbs; iOS id1630430321; Android online.mindextension.audioplayer)
- Released 26 Jun 2022, v5.3.0 updated 12 Nov 2026, 4.83 stars from 64 ratings — [AS-lookup](https://itunes.apple.com/lookup?id=1630430321&country=us); Android 10K+ installs, 4.6 stars, 547 reviews — [GP](https://play.google.com/store/apps/details?id=online.mindextension.audioplayer&hl=en&gl=US)
- Features (the most layered mixer in the set): pick a goal, then "Mixes". A full-screen "Experience" shows each affirmation as it is spoken over matching visuals, with visual effects (Ripple, Light, Blossom, Lanterns) and **haptic vibration with each affirmation**. Separate sliders for affirmations, hundreds of songs, nature sounds, ASMR, white/brown/pink noise, binaural and isochronic programs that change over time, solfeggio 174-963 Hz. Thousands of affirmations in 60 categories, write your own, AI generation, own-voice recording. A Subliminal mode that "carries the words on a high-frequency tone, layers them and moves them around you" with **18 voice effects**. An Explore tab that learns from what you play, home-screen widgets, offline once played, backup across devices (Ultimate). Free tier caps sessions at 20 minutes — [AS-lookup](https://itunes.apple.com/lookup?id=1630430321&country=us)
- IAPs: Monthly $4.99 or $12.99, Yearly $24.99 or $39.99, Lifetime $79.99 (and an odd $6.99 Lifetime and $1.99 tier, probably old or promotional) — [AS-page](https://apps.apple.com/us/app/id1630430321)

**The Healing Mind** (Morgan Sachs Enterprises LLC; iOS id1632086744; Android com.v16b12a02e51.www)
- The iTunes lookup API returns 0 results for id1632086744 in the US, GB, CA and AU stores, and the US App Store page returned an empty page (about 1 KB) on 14 Nov 2026, so the app may have been removed or pulled from those storefronts — [AS-lookup](https://itunes.apple.com/lookup?id=1632086744&country=us)
- A web search still shows App Store and Play listings. The search engine's summary (not checked by me) said: 100+ subliminals and meditations, energy-healing framing by Morgan Sachs ("quantum energy healer and psychic medium"), IAPs at $9.99 and $99.99, Play rating 4.1 from 20 reviews — [Google Play](https://play.google.com/store/apps/details?id=com.v16b12a02e51.www&hl=en), [site](https://www.thehealingmindapp.com/)

**Other library apps found**
- Fate – Subliminals (MintMarketing LLC, id6744332634): ready-made tracks, collections, reminders, night mode, "aesthetic" design. 4.3 stars from 10 ratings. Weekly $4.99, Monthly $13.99, Annual $39.99 — [AS-lookup](https://itunes.apple.com/lookup?id=6744332634&country=us), [AS-page](https://apps.apple.com/us/app/id6744332634)
- Siren Mind (WAQYSTUDIOS, id6798861411, Sep 2026): Greek-myth-themed subliminals over original music plus short animated films — [AS-lookup](https://itunes.apple.com/lookup?id=6798861411&country=us)
- KYO. Affirmations+Subliminals (kyo UG, id1492576654): background affirmations, "Speak After Me" repetition, silent subliminal mode, sleep timer — [AS-lookup](https://itunes.apple.com/lookup?id=1492576654&country=us)

#### Adjacent apps with large Android reach (not audio subliminal makers)
- Innertune Affirmations (com.innertune.app): 100K+ installs, 4.5 stars, 14.3K reviews. It came up in Play's "subliminal" search, so it is the main affirmation-audio rival on Android — [GP](https://play.google.com/store/apps/details?id=com.innertune.app&hl=en&gl=US)
- Subliminal Messages Lite (MegaBit, com.MegaBit.SubliminalLite): 100K+ installs, 4.1 stars, 3.36K reviews. **Visual** on-screen flashing of 1,300+ messages; Pro version (com.MegaBit.Subliminal) has 1K+ installs — [GP](https://play.google.com/store/apps/details?id=com.MegaBit.SubliminalLite&hl=en&gl=US)
- Sublim (Sentix Apps, com.subliminalvision.app): 1K+ installs, 3.7 stars. Visual flashing while you use your phone — [GP](https://play.google.com/store/apps/details?id=com.subliminalvision.app&hl=en&gl=US)
- Subliminal Messages (VT Entertainment): 5K+ installs, last updated Jan 2024 — [GP](https://play.google.com/store/apps/details?id=com.kb.subliminal&hl=en&gl=US)
- Subliminal Success Accelerator (Mind Movies): 10K+ installs, 3.3 stars — [GP](https://play.google.com/store/apps/details?id=com.mindmovies.ssa&hl=en&gl=US)

### Inferences
- The maker segment is new and crowded: at least 15 maker apps launched between March 2025 and October 2026, and most have under 60 US ratings. VibeSesh is the clear maker leader on both stores. Decrétalo is growing fastest by reviews per month (148 iOS ratings and 1.28K Play reviews in under 5 months).
- Android is less served: SelfMade, Whispurry, Hopium, CosmosTune and iMobLife have no Play listing found. Only VibeSesh, Decrétalo and Sublimind reach 10K+ installs among makers there.
- Monetisation is split between plain subscriptions (weekly $4.99-7.99, monthly $9.99-12.99, yearly $29.99-59.99, lifetime about $79.99) and credit systems for AI generation (ProgramU, JustSubly, Whispurry, Sublimind's per-track packs), which signals real per-generation TTS/LLM costs.

### Gaps
- No reliable download or revenue numbers: MWM's figures ("<1k" for VibeSesh with 1.7K ratings) are not credible, and AppstoreSpy shows blanks. Sensor Tower, Appfigures and AppMagic pages were not fetched (they need a login or are not public).
- IAP periods (weekly, monthly, yearly) are not labelled for VibeSesh, JustSubly, Whisperloop or CosmosTune. Mappings marked "probably" are inferred from price points.
- Which TTS engine each app uses (ElevenLabs, OpenAI and so on) is not stated in any listing. Only ProgramU claims voice cloning.
- The Healing Mind's status is unconfirmed (it may be removed from the US store). The IAP list for Subliminal daily affirmations was not captured (the scrape failed).
- Only US storefronts were checked, so region-specific apps (for example Korean or Japanese ones) may be missing.

## Feature comparison: which features are table stakes, which are rare, and what nobody does

### Takeaway
Table stakes for a maker in 2026: typed affirmations, AI-written affirmations, TTS and own-voice recording, ambient backgrounds plus binaural or solfeggio layers, separate volume sliders, looping, a sleep timer, background playback and a "see every word" transparency pitch. Rare: voice cloning, home-screen widgets, cloud backup, playing under other apps live, speed and echo effects, haptics and social features. Not seen in any listing: exporting audio files for use outside the app, frame-exact control of speed-up or reverse "techniques", true multi-language support, Apple Watch or CarPlay, and any evidence or measurement of results beyond self-tracking.

### Cited Findings
Matrix (Y = claimed in the listing, - = not mentioned; sources are the per-app AS-lookup and GP links above):

| App | Own voice | AI/TTS voice | Clone | AI affirmations | Library | Backgrounds | Binaural/solfeggio | Layering/effects | Plays under other apps | Playlists | Sleep timer | Widget | Reminders | Offline | Backup/sync | Android |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| VibeSesh | Y | Y | - | Y | 150+ | Y + Spotify/YouTube | - | volume only | Spotify/YouTube as background | - | Y | - | - | - | - | Y 10K+ |
| Sublimind | - | Y (6 layers) | - | Y (free) | Y free | Y | "rhythmic tones" | Y layers by tier | - | Y | Y fade | - | Y | Y | - | Y 10K+ |
| Decrétalo | - | Y | - | Y (narratives) | Y | - | - | - | - | - | - | - | - | - | - | Y 10K+ |
| SelfMade | Y (core) | - | - | Y | scripts | Y | Y (5 options) | 3 modes, SATS | - | - | Y | - | - | Y local | - | - |
| ProgramU | - | Y cast | **Y** | Y + coach | Y Archive | Y | - | Y | own music/podcast | - | - | **Y** | - | - | - | Y 100+ |
| JustSubly | Y | Y (10 voices) | - | Y | thousands + uploads | Y + own audio | Y tone | **speed, echo, 10-stack, 4 layers** | - | Y + community | Y | - | Y 3/day | Pro | - | Y 100+ |
| Whispurry | - | Y | - | - | - | Y | - | algorithmic | - | - | - | - | - | - | - | - |
| Hopium | Y | Y | - | - | discover | Y | Y | silent, speed, multi-voice | yes (background) | - | - | - | - | - | - | - |
| Quency | - | Y neural | - | - | presets | Y | - | 20 kHz silent | **live under Spotify/YouTube** | Y | Y | - | - | - | - | - |
| CosmosTune | - | - | - | Y | 100K+ claimed | - | Y | levels | under TikTok/Spotify/Netflix | - | - | - | - | - | - | - |
| SubliminalGen | Y | - | - | AI music | Y music | Y + Apple Music | Y multi-layer | loop 30m-8h | Apple Music | - | - | - | - | - | - | - |
| SubCore | Y | - | - | - | - | - | Y | silent mode | - | - | - | - | Y timed | Y | none (local) | Y 100+ |
| ReliefMix | Y | Y | - | Y | thousands | Y extensive | Y + isochronic programs | **18 voice effects, spatial** | - | Y | Y (Ultimate) | **Y** | Y | Y | **Y (Ultimate)** | Y 10K+ |
| Sound & Soulful | - | - | - | - | 130+ ×8 backgrounds | Y | - | - | - | Y | - | - | - | - | - | Y 10K+ |
| Powerful Subliminal | - | - | - | - | Y | - | "healing freq." | - | - | Y | - | - | - | - | - | Y 10K+ |
| iMobLife | Y | - | - | - | Y topics | - | - | - | - | collections | - | - | Y | - | - | not found |
| Subtopia (Android) | Y | Y | - | Y? "advanced generation" | - | Y | Y | stacking, import | - | Y | - | - | - | - | **Y cloud** | Y 1K+ |

- Transparency ("see every word") is used as a selling point by VibeSesh, Whispurry, SelfMade, ProgramU, JustSubly and Quency — [VibeSesh](https://itunes.apple.com/lookup?id=6746336493&country=us), [Quency](https://itunes.apple.com/lookup?id=6759976812&country=us)
- Privacy and local-only storage is a selling point for SubCore, SelfMade, Whisperloop and Subliminal Studio — [SubCore](https://itunes.apple.com/lookup?id=6751504616&country=us), [Subliminal Studio](https://play.google.com/store/apps/details?id=com.subliminalstudio.app&hl=en&gl=US)
- Subliminal Studio explicitly says "audio-file export is not included", the only listing to address export at all — [GP](https://play.google.com/store/apps/details?id=com.subliminalstudio.app&hl=en&gl=US)
- Habit and gamification layers (streaks, badges, XP, manifestation tracking) appear in Sublimind, JustSubly, SelfMade, Quency, Whisperloop and SubliminalOS — see the per-app links above
- Social features (circles, listening parties, community playlists) appear only in JustSubly. Live group sessions appear only in ProgramU (CollectiveU) — [JustSubly](https://itunes.apple.com/lookup?id=6782797650&country=us), [ProgramU](https://itunes.apple.com/lookup?id=6767283547&country=us)
- Read-along or on-screen affirmations while playing: ReliefMix (Experience), Decrétalo (synced text), JustSubly (affirmation rain), Sound & Soulful (readable affirmations) — see links above

### Inferences
- **Table stakes** (in most makers): typed affirmations, AI-drafted affirmations, TTS plus own-voice recording, ambient sound backgrounds, a frequency layer (binaural/solfeggio), separate voice and background volume, looping, a sleep timer, background playback, a ready-made library or templates, and a transparency claim.
- **Uncommon** (2-4 apps): playing under other apps (Spotify, YouTube, Apple Music, TikTok) as a live overlay; streaks and gamification; reminders timed to sleep or waking; offline downloads; layering intensity tiers; read-along text.
- **Rare** (1 app or close to it): voice cloning (ProgramU only); home-screen widget (ProgramU, ReliefMix); cross-device backup (ReliefMix Ultimate, Subtopia Pro); speed and echo controls and 10-track stacking (JustSubly); 18 voice effects and spatial movement (ReliefMix); haptics with each affirmation (ReliefMix); AI manifestation songs (Subwave); AI music (SubliminalGen); 20 kHz FM "silent" encoding (Quency, Subliminal Audio Creator); AI coach chat (ProgramU); social and listening parties (JustSubly).
- **Not seen in any listing** (possible gaps to own): exporting finished subliminals as audio files to keep or share outside the app; explicit classic techniques such as reversed audio, extreme speed-up multipliers or "booster" stacking presets (only JustSubly speed and Hopium "speed reading" come close); a clearly named voice provider or premium natural-voice marketplace; multi-language affirmations and voices; Apple Watch, CarPlay or lock-screen Live Activities; a free tier that is generous without credits; and any honest effect measurement beyond self-reported tracking (only Whisperloop states that efficacy is unproven).
- **Positioning clusters:** (1) "Transparency maker" (VibeSesh, Whispurry, Quency): Gen-Z TikTok subliminal culture, people wary of YouTube subs with hidden content. (2) "Goddard / manifestation practitioner" (SelfMade, SubCore, Subwave, Soularia). (3) "AI studio / coach" (ProgramU, Sublimind, Decrétalo, CosmosTune), with premium pricing and credits. (4) "Creator-brand library" (Sound & Soulful, Powerful Subliminals, The Healing Mind), highest prices ($179.99 a year, $299.99 lifetime). (5) "Wellness mixer" (ReliefMix), a sleep and calm audience with the deepest audio feature set.
- **Pricing benchmarks:** the yearly median is about $39.99 (Hopium, SelfMade, Fate, Subwave, Decrétalo, EmpowerMe); weekly $4.99-7.99; lifetime $79.99 (SelfMade, ReliefMix); premium outliers are ProgramU at $199.99 a year and Sound & Soulful at $179.99 a year.

### Gaps
- Feature presence is based only on listing text, so an app may have features it does not mention (for example, playlists in VibeSesh). Confirming them would need hands-on testing, which was out of scope (no sign-ups or purchases).
- TTS naturalness could not be judged without using the apps. Only the marketing words are captured ("natural", "neural", "studio-quality", "human-like").
