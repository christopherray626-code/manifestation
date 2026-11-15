# Competitor teardown: Sublime: Subliminals (iOS, Morgan Kievits / "Axiom House")

Researched 2026-11-14. Primary sources: iTunes lookup API, the US App Store page (fetched with curl), the website's 81 sitemap URLs (all English pages fetched, plus privacy policy and terms), the sibling app's App Store page, and web and social handle checks. Abbreviations: AS = [App Store page](https://apps.apple.com/us/app/sublime-subliminals/id6817551957), API = [iTunes lookup](https://itunes.apple.com/lookup?id=6817551957), Site = [sublimesubliminals.com](https://www.sublimesubliminals.com/), PP = [Privacy policy](https://www.sublimesubliminals.com/privacy/), ToS = [Terms](https://www.sublimesubliminals.com/terms/).

## 1. Full feature list

### Takeaway
Sublime is a "personal manifestation audio studio". You pick an intention and get AI-suggested affirmations (OpenAI) or write your own. You record them in your own voice or use text-to-speech, mix them over a background sound (white noise, pink noise, ambience, or none), set speed, voice layers, volumes and a duration from 30 minutes to 8 hours, then save the result to a library. It has no ready-made track catalogue that it markets, makes no frequency or binaural claims inside the app, and lists no widgets, reminders, playlists or Android version.

### Cited Findings
- App Store subtitle: "Affirmations & Manifestation". The App Store description opens "Your words. Your voice. Your reality." and calls the app "your personal manifestation audio studio" — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957); [API](https://itunes.apple.com/lookup?id=6817551957)
- Feature bullets in the description: write and customize your own affirmations; record them in your own voice; generate spoken affirmations with text-to-speech; choose from calming background sounds; customize the audio and listening duration; save creations to a personal library — [API](https://itunes.apple.com/lookup?id=6817551957)
- Intention categories in the description: Manifestation & Law of Assumption; Self-Concept & Self-Love; Money, Wealth & Abundance; Love & Relationships; Confidence & Self-Worth; Beauty & Self-Image; Success & Career; Motivation & Positive Mindset; Personal Growth & New Beginnings — [API](https://itunes.apple.com/lookup?id=6817551957)
- Intention chips on the website: Self Concept, Love, Wealth, Confidence, Beauty, Luck, Success, Relationships, Focus, "Your own goal" — [Site](https://www.sublimesubliminals.com/)
- The site describes a four-step flow: 01 choose affirmations (write your own or explore suggestions for the intention; "review every line"); 02 choose a voice (record yourself or use generated speech); 03 choose a sound ("white noise, pink noise, soft ambience, or another available background"; voice and background volumes adjust separately); 04 "Create your Sublime" (set listening duration, affirmation speed and voice layers, then return to it in the library) — [Site](https://www.sublimesubliminals.com/)
- Duration choices run "from 30 minutes to eight hours"; the sleep page says to choose a background "according to comfort rather than claims about special frequencies" — [Sleep affirmations page](https://www.sublimesubliminals.com/sleep-affirmations/)
- "Speed changes how the affirmations sound; layers play voice audio together" (the site deliberately makes no promise that more layers or faster speech works better) — [Subliminal maker page](https://www.sublimesubliminals.com/subliminal-maker/)
- Schema.org featureList: "Personalized affirmations", "Own-voice recording and text to speech", "Background sounds and separate voice volume", "Affirmation speed and layers", "Listening duration and personal library" — [Subliminal maker page](https://www.sublimesubliminals.com/subliminal-maker/)
- AI: "Sublime uses OpenAI's API to generate personalized affirmations and related summaries". Onboarding answers (goals, desired feelings, personal context, motivations, selected beliefs or patterns) are sent to OpenAI; earlier affirmations are included when you ask for more suggestions — [PP](https://www.sublimesubliminals.com/privacy/)
- The ToS has a section titled "AI-generated content" covering affirmations, suggestions and summaries — [ToS](https://www.sublimesubliminals.com/terms/)
- Screenshot captions on the site: "Sublime home screen with your personal subliminals"; "Choose affirmations for your Sublime"; "Record your own voice for your affirmations"; "Choose background sound and adjust audio volume"; "Adjust affirmation speed, layers, and listening duration"; "Create a Subliminal by choosing your intention"; "Sublime voice recording screen"; "Sublime player showing Lucky Me affirmations and Pink Noise" — [Site](https://www.sublimesubliminals.com/)
- The App Store listing has 7 iPhone screenshots and 1 iPad screenshot — [API](https://itunes.apple.com/lookup?id=6817551957)
- Backend: Convex (auth, database, analytics); Cloudflare R2 (stores and delivers recordings, generated speech and audio files); sign-in by email, Apple or Google; Resend for verification and password-reset emails — [PP](https://www.sublimesubliminals.com/privacy/)
- The description says you can "play your affirmations alongside your favorite music" — [API](https://itunes.apple.com/lookup?id=6817551957)
- It is a universal iPhone/iPad app that also runs on Apple-silicon Macs and Vision Pro. It needs iOS 16.4 or later, is 61.9 MB, is rated 4+, and its categories are Health & Fitness and Lifestyle. Bundle id `com.axiomhouse.sublime` — [API](https://itunes.apple.com/lookup?id=6817551957); [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957)
- Accessibility: "The developer has not yet indicated which accessibility features this app supports" — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957)
- Free lead magnet on the website: a "Money Magnet · 417 Hz" MP3 sent by email after double opt-in (Resend handles the email) — [Free subliminal page](https://www.sublimesubliminals.com/free-subliminal/)

### Inferences
- The core loop matches ours closely: intention, then AI or own affirmations, then own voice or TTS, then a mix, then a library. The differences are in breadth rather than concept.
- Audio is uploaded to R2 and the app is free to download with a paywall on creation, so creation and storage almost certainly run server-side. The App Store page never mentions offline listening, unlike the sibling app Psyche, which says "listen offline".
- The site disclaims frequencies in the app ("comfort rather than claims about special frequencies"), yet the email lead magnet is a "417 Hz" track. Their messaging is inconsistent, and the frequency idea is probably used for marketing only.
- I found no evidence of a preset track library, playlists, widgets, reminders, streaks, sharing or export. The visible features suggest the app is single-purpose.

### Gaps
- The TTS provider is not named. The privacy policy lists only OpenAI, Convex, R2, Apple, Google, RevenueCat, Superwall and Resend, so TTS is either OpenAI TTS or Apple's on-device speech, and I couldn't confirm which. There is no claim of "natural AI voices" or ElevenLabs.
- The full list of background sounds is unknown beyond white noise, pink noise, "soft ambience" and none.
- I could not view the App Store screenshot images' text, only the website's captions.

## 2. Pricing and paywall

### Takeaway
It is hard-paywalled: "Subscription required to access custom audio creation features." There are 8 in-app purchase SKUs, from $4.99 a week to a $99.99 lifetime, and Superwall runs A/B paywall and offer tests. Prices are therefore not fixed. Trials may be offered, but none is advertised.

### Cited Findings
- In-App Purchases on the US App Store: Pro Weekly $4.99; Sublime Pro Monthly $9.99; Sublime Lifetime $99.99; Pro $6.99; Pro $59.99; Pro $9.99; Pro $39.99; Pro Monthly $14.99 — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957)
- "Subscription required to access custom audio creation features" — [API](https://itunes.apple.com/lookup?id=6817551957)
- The site repeatedly says "Custom subliminal use requires a subscription. See current offers in the app." — [Site](https://www.sublimesubliminals.com/)
- Terms: plans "may include weekly, monthly, or annual subscriptions, or a lifetime purchase where offered"; the paywall shows "any trial or promotional terms"; "Lifetime" means the operating lifetime of the service; "Feature availability and any applicable usage limits are described in the app" — [ToS](https://www.sublimesubliminals.com/terms/)
- "Superwall: paywall presentation, offer experiments" and "Superwall may assign users to different paywall or subscription" offers; RevenueCat handles entitlements; listening activity is tied to renewal and cancellation data — [PP](https://www.sublimesubliminals.com/privacy/)

### Inferences
- The unnamed $39.99 and $59.99 "Pro" SKUs are probably annual tiers under test, and $6.99/$9.99 are probably alternate weekly or monthly price points. This follows the standard RevenueCat + Superwall "hard paywall after onboarding" growth playbook.
- "Usage limits" in the terms suggests a cap on AI or TTS generation even for subscribers.
- The free tier is probably little more than onboarding plus perhaps listening to suggestions, because creation is paywalled.

### Gaps
- Trial length and the default paywall layout are not visible without installing the app, which I did not do.
- Mapping each SKU to its billing period is a guess, because Apple's listing omits periods for the "Pro" entries.

## 3. Onboarding, design, audience and languages

### Takeaway
Onboarding is a long personalization quiz: name, optional age, goals, desired feelings, interests, listening preferences, motivations, beliefs and free-text answers. It runs before sign-up, under a guest ID, and feeds the AI affirmations, which is the usual quiz-then-paywall funnel. The brand is soft and feminine, aimed at Law of Assumption and "self-concept" manifesters (TikTok-style "lucky girl" vocabulary such as "Lucky Me" and "Money Magnet"). The app ships in five languages.

### Cited Findings
- Onboarding data collected: "your name, optional age, goals, desired feelings, interests, listening preferences, motivations, beliefs, and written responses". It is saved "before you create an account and associated with a guest identifier" — [PP](https://www.sublimesubliminals.com/privacy/)
- Onboarding progress is tracked as analytics, and listening milestones and returns are measured — [PP](https://www.sublimesubliminals.com/privacy/)
- Taglines: "Your affirmations. Your voice. Your sound." (site and social card) and "Your words. Your voice. Your reality." (App Store) — [Site](https://www.sublimesubliminals.com/); [API](https://itunes.apple.com/lookup?id=6817551957)
- A screenshot caption shows a sample track, "Lucky Me" affirmations with Pink Noise — [Site](https://www.sublimesubliminals.com/)
- Use contexts: Morning, Focus, Sleep — [Site](https://www.sublimesubliminals.com/)
- Minimum age is 13; minors need a guardian's permission — [ToS](https://www.sublimesubliminals.com/terms/)
- Languages: English, French, German, Portuguese, Spanish (App Store). The website is localized into fr, de, es-MX and pt-BR, with translated slugs — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957); [Sitemap](https://www.sublimesubliminals.com/sitemap.xml)
- The tone is careful about evidence: "Subliminals do not guarantee personal change", "Sublime does not promise better sleep or changes to your subconscious while you sleep" — [Site](https://www.sublimesubliminals.com/)

### Inferences
- Target users are teen and young-adult women in the LOA/self-concept community (the beauty and luck categories, "Lucky Me"). The site's careful disclaimers suggest they are keeping App Store review risk low.
- Their onboarding asks deeper psychological questions (beliefs, patterns) than a simple goal picker, which is borrowed from their meditation app Psyche.

### Gaps
- I could not see the actual onboarding screens, colour palette or icon details. The icon is at the artwork URL in the API, and the site HTML only shows that a logo exists.

## 4. Marketing channels and SEO

### Takeaway
Their marketing so far is mostly SEO plus email capture. They run an 81-URL, 5-language content site (16 English pages × 5 locales plus legal pages) with schema.org markup and a free MP3 lead magnet. I found no verifiable TikTok, Instagram, YouTube or Reddit presence, and no press. Search engines do not yet index the site well: a web search for the domain returned nothing from it.

### Cited Findings
- The sitemap's SEO pages, each in 5 locales: subliminal-maker, affirmation-recorder, sleep-affirmations, subliminals-for-confidence, subliminals-for-self-love, how-to-make-subliminals, what-are-subliminals, subliminals-vs-affirmations, how-to-record-affirmations, 50-self-concept-affirmations, do-subliminals-work, guides, subliminals-vs-supraliminals, plus free-subliminal (English only), privacy and terms — [Sitemap](https://www.sublimesubliminals.com/sitemap.xml)
- Pages carry Organization, Person (publisher Morgan Kievits), WebSite, SoftwareApplication and Breadcrumb JSON-LD. The contact email is sublimesubliminalsapp@gmail.com — [Site](https://www.sublimesubliminals.com/)
- A lead-capture popup and a /free-subliminal page post to `/api/subscribe`, with marketing consent "listening inspiration, product updates and offers" — [Free subliminal page](https://www.sublimesubliminals.com/free-subliminal/)
- The site's HTML has no social media links (only Twitter-card meta tags) — [Site](https://www.sublimesubliminals.com/)
- YouTube @SublimeSubliminals exists, "Joined Jun 8, 2026", "This channel doesn't have any content", and isn't linked from the site, so it may not be theirs — [YouTube](https://www.youtube.com/@sublimesubliminals)
- Instagram @sublimesubliminals is a personal-looking account ("tea 🍵", 108 followers, 1 post) and is probably unrelated — [Instagram](https://www.instagram.com/sublimesubliminals/)
- A web search for "sublimesubliminals.com" returned no results from the domain — [WebSearch, 2026-11-14]
- App Store "You Might Also Like" lists Sigfre, Mantria, Relogue, SoulSpeak and Wish Fulfi(lled…), which are Apple's neighbouring competitor set — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957)

### Inferences
- The build looks like an SEO-first solo-developer playbook (localized long-tail pages, an email list, paywall testing). Paid UGC or TikTok may come later.
- The localized SEO in FR/DE/ES/PT is a real head start in non-English markets.

### Gaps
- I couldn't check TikTok profile content: the pages load as a JavaScript shell, and both @sublimesubliminals and @sublimesubliminalsapp returned a generic page. Reddit blocked automated access. Appfigures sits behind Cloudflare, and the mwm.ai page returned 410. There are no download or revenue estimates.

## 5. Developer background, other apps, Android, trademarks

### Takeaway
Morgan Kievits is a solo developer based in Alberta, Canada, publishing under the brand "Axiom House". There is one earlier app, Psyche: Custom Meditations (AI-personalized guided meditations, July 2026), which also has 0 ratings. I found no Android version and no public footprint for the person.

### Cited Findings
- "Sublime is operated from Alberta, Canada"; the governing law is Alberta and Canada — [PP](https://www.sublimesubliminals.com/privacy/); [ToS](https://www.sublimesubliminals.com/terms/)
- Sublime's bundle id is `com.axiomhouse.sublime`. Psyche's App Store copyright is "© Axiom House" — [API](https://itunes.apple.com/lookup?id=6817551957); [Psyche AS](https://apps.apple.com/us/app/id6789704737)
- Psyche: Custom Meditations (id6789704737, bundle com.psycheapp.app) was released 2026-07-30 and is at v1.4.1 (2026-10-23). It is English only and has 0 ratings. Its IAPs are Pro Monthly $13.99 and Pro Weekly $6.99. It is "AI-powered guided meditations" with Manifest/Rewire/Explore/Presence modes and offline listening; its site is psychemeditation.com — [iTunes lookup Psyche](https://itunes.apple.com/lookup?id=6789704737); [Psyche AS](https://apps.apple.com/us/app/id6789704737)
- The developer has exactly these two apps — [Developer lookup](https://itunes.apple.com/lookup?id=6789704739&entity=software)
- A web search for "Morgan Kievits" found no matching person (only unrelated Dutch Kievits) — [WebSearch, 2026-11-14]
- Android: the Google Play URL for `com.axiomhouse.sublime` returns 404, and a Play search for "sublime subliminals" shows no Sublime app — [Google Play](https://play.google.com/store/apps/details?id=com.axiomhouse.sublime)
- The site says "Sublime is an iPhone app" — [Site](https://www.sublimesubliminals.com/)

### Inferences
- The developer reuses a stack and funnel across apps (AI personalization, a deep onboarding quiz, weekly subscriptions) and ships quickly: 5 Sublime releases in 4 weeks.

### Gaps
- Trademarks: I could not search USPTO or CIPO with the available tools. Whether "Sublime" or "Axiom House" is filed is unknown, and "Sublime" is a crowded mark (Sublime Text and others).

## 6. Update history, reviews and traction

### Takeaway
There have been 5 releases in about 4 weeks, all with the same generic release note. The app has zero ratings and reviews on the US store after a month, so traction is minimal.

### Cited Findings
- Versions: 1.0 (Oct 15), 1.0.1 (Oct 23), 1.0.3 (Oct 30), 1.0.4 (~Nov 8, "6d ago"), 1.0.5 (Nov 10). Every note says "New version, new you. We've made creating your subliminals easier, improved audio playback for smoother listening, and added some exciting upgrades…" — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957)
- userRatingCount 0, averageUserRating 0 (US) — [API](https://itunes.apple.com/lookup?id=6817551957)
- "This app hasn't received enough ratings or reviews to display an overview" — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957)
- The privacy policy took effect November 9, 2026, so it was updated just before 1.0.4/1.0.5 — [PP](https://www.sublimesubliminals.com/privacy/)

### Inferences
- The "improved audio playback" notes hint at early playback reliability problems, and the policy tracks "playback errors".

### Gaps
- No download or revenue estimates (aggregators blocked). Ratings in other storefronts were not checked.

## 7. Strengths and weaknesses vs a fuller app (AI affirmations, natural AI voices, ready-made tracks, Android)

### Takeaway
**Strengths:** they already have AI-written affirmations, own-voice recording, layers, speed and long durations, plus 5-language localization, localized SEO, an email funnel, paywall A/B testing and careful, App-Review-safe claims. **Weaknesses:** iOS only, a hard paywall with no visible free value, no evidence of natural or premium AI voices, a thin sound library with no frequencies or binaural beats, no marketed ready-made tracks, zero reviews, no social presence, and probably server-dependent playback.

### Cited Findings
- Strength, AI: OpenAI-generated personalized affirmations from onboarding — [PP](https://www.sublimesubliminals.com/privacy/)
- Strength, 5 languages in app and site — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957); [Sitemap](https://www.sublimesubliminals.com/sitemap.xml)
- Weakness, the paywall on creation — [API](https://itunes.apple.com/lookup?id=6817551957)
- Weakness, the backgrounds named are only white noise, pink noise, soft ambience or none, and the site plays down frequencies — [Sleep page](https://www.sublimesubliminals.com/sleep-affirmations/)
- Weakness, no Android — [Google Play 404](https://play.google.com/store/apps/details?id=com.axiomhouse.sublime)
- Weakness, no accessibility declarations — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957)
- Weakness, heavy data collection is linked to identity (purchases, email, name, audio data, user content, user ID), and listening is tied to subscription status in an admin dashboard — [AS](https://apps.apple.com/us/app/sublime-subliminals/id6817551957); [PP](https://www.sublimesubliminals.com/privacy/)

### Inferences
- Openings for us: Android or cross-platform; natural AI voices (for example ElevenLabs) as a headline feature; a free tier with ready-made tracks so users get value before the paywall; richer soundscapes plus optional frequency or binaural layers (the community wants these, as Sublime's own 417 Hz lead magnet shows); offline downloads; widgets and reminders; and visible social or UGC marketing, where Sublime currently has none.
- Threats from them: fast iteration, localized SEO, and a funnel already tuned with Superwall. Their pricing ($4.99 a week, $9.99 to $14.99 a month, about $39.99 to $59.99 a year, $99.99 lifetime) is a useful benchmark for us.

### Gaps
- Without installing the app I could not judge audio quality, voice naturalness or how much of the onboarding is free.
