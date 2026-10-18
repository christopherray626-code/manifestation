# Designing a great consumer mobile app: research notes for the manifestation app

*Compiled October 2026 for Chris. Scope: Expo / React Native on iOS, Android and web, for a Gen Z audience, with mystical themes. Competitors: I am, Innertune, ThinkUp, Calm, Headspace, binaural-beats apps.*

**How to read this.** Each section gives the rule and the number behind it where one exists, then what it means for this app. Numbers marked *(secondhand)* come from vendor blogs or write-ups quoting a study rather than the study itself. Treat them as a direction to head in, not a figure to hit. Several primary sites (m3.material.io, revenuecat.com, blog.duolingo.com) couldn't be reached from the research environment, so some figures are cited through the summaries that quote them.

---

## 1. Layout fundamentals

**Thumb zones.** Steven Hoober watched 1,333 people using phones in public. Of the 780 who were touching the screen, 49% held the phone in one hand, 36% cradled it in one hand and tapped with the other, and 15% used both hands. Of the one-handed users, 67% used their right thumb ([summary via Addy Osmani](https://addyosmani.com/blog/touch-friendly-design/), [Loop Insight](https://loopinsight.com/2013/12/02/how-users-hold-mobile-devices)).
- Put the main action (Play, Continue, Start trial) in the bottom third of the screen. Put things people rarely touch (settings, edit, share) at the top.
- On today's 6.1 to 6.9 inch phones, the top corners are the hardest spots to reach. Never put the only way out of a flow, such as a paywall close button, somewhere that hard to tap *and* make it tiny. That combination is a dark pattern (see section 7).

**Touch targets.**
- iOS: at least **44×44 pt** ([Apple HIG, Layout](https://developer.apple.com/design/human-interface-guidelines/layout); [Deque](https://dequeuniversity.com/rules/attest-ios/1.0/touch-target-size)).
- Android: at least **48×48 dp**, with about 8 dp between targets ([Material accessibility](https://m3.material.io/foundations/designing/structure)).
- Web: WCAG 2.2 sets **24×24 px** as the AA minimum and 44×44 as AAA ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- An icon can look smaller than its target. A 24 pt heart icon is fine as long as it sits inside a 44 pt hit area. In React Native, use `hitSlop` or padding to get there.
- Rule for this app: **48 everywhere.** That one number covers both platforms.

**Spacing scale.** Use a 4 pt base and mostly multiples of 8: **4, 8, 12, 16, 24, 32, 48, 64**. Material's layout grid is built on 8 dp, with 4 dp for small details ([M3 layout](https://m3.material.io/foundations/layout/understanding-layout/spacing)).
- Put the scale in a single `spacing` token file, and don't use a value that isn't on it.
- Screen side margins: **16 pt** (or 20 to match iOS's look). Gap between cards: 12 to 16. Gap between sections: 24 to 32.
- Refactoring UI's advice holds: start with too much white space and remove some. Calm, airy layouts suit a meditation brand ([Refactoring UI](https://www.refactoringui.com/)).

**Safe areas.** Respect the notch or Dynamic Island, the home indicator and Android's gesture bar.
- Use `react-native-safe-area-context` throughout, and turn on edge-to-edge on Android, which is required from Android 15 when targeting SDK 35 ([Android edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)).
- Backgrounds and gradients should run *under* the system bars. Text and buttons should sit *inside* the safe area.
- The mini-player and tab bar sit on top of the bottom inset. They don't replace it.

**Type scale and line length.**
- The iOS default body size is **17 pt**. Material's body size is 14 to 16 sp. Don't go below 16 for body text that people read.
- Use a modular scale of about 1.2 to 1.25. For example: 12 caption / 14 small / 16 body / 20 title / 24 heading / 32 display / 40 hero.
- Line height: about 1.4 to 1.5× for body text and 1.1 to 1.2× for large headings.
- Line length: **45 to 75 characters** ([Baymard](https://baymard.com/blog/line-length-readability)). On a phone, 16 pt text with 16 pt margins lands naturally at about 40 to 50 characters. On web and tablet, limit content width to about 600 to 680 px.
- Fonts: **2 families at most** (a characterful display serif for the mystical feel, plus a clean sans for the interface) and **2 to 3 weights** (Regular, Medium or Semibold, and maybe Bold). More weights than that blurs the hierarchy.
- Use one size and weight jump per level of hierarchy. If everything is bold, nothing stands out.

**Hierarchy and density.**
- Each screen should answer "what's the one thing to do here?"
- Give it **one primary button**: filled, accent colour, at the bottom. Secondary actions get a quieter style (outlined or plain text).
- Hick's law: decision time grows with the number of choices ([Laws of UX](https://lawsofux.com/hicks-law/)). Fewer, larger choices beat a crowded grid.
- Meditation and affirmation users are often anxious or winding down. Keep density **low** and make the content (artwork, the affirmation itself) the hero.

---

## 2. Navigation patterns

**Tab bar.** Apple: "In general, use three to five tabs in iOS." Every extra tab adds complexity ([Apple HIG, Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)). Material's navigation bar likewise holds 3 to 5 destinations ([M3 navigation bar](https://m3.material.io/components/navigation-bar/guidelines)).
- Every tab gets an icon plus a one-word label. Don't use icon-only tabs.
- Tapping the active tab scrolls back to the top or pops to the root.
- **For this app, use 4 tabs:** *Today* (the daily affirmation and session), *Explore* (library by intention), *Create* (your own affirmations or voice), *Me* (streak, favourites, downloads, settings). Paywall, settings and player are not tabs.

**Stacks.** Drill down (list, then detail) inside each tab using a native stack (`expo-router` + `react-native-screens`) so you get the platform's own transitions and swipe-back for free.

**Sheets and modals.**
- Use sheets for short, focused tasks: sleep timer, voice picker, background-sound mixer, share.
- Use full-screen modals for flows with a clear finish: onboarding, paywall, recording.
- Sheets need a visible grab handle, a close or done control, and swipe-down to dismiss. Medium or large detents work well for pickers.

**Mini-player (essential for audio).** This is the Spotify / Apple Music / Calm pattern.
- While audio plays, a slim bar (about 56 to 64 pt tall) sits directly above the tab bar. It shows artwork, title, play/pause, and optionally a thin progress line.
- Tapping it, or swiping it up, expands the full player as a modal. Swiping down collapses it again.
- It must persist across every tab and push screen. Build it once at the root layout.

**Gestures.** Gestures should only be shortcuts, never the only way to do something. Anything you can swipe needs a visible button too.
- Don't take over the screen edges. iOS swipe-back and Android's system back gesture live there.

**Android back.**
- System back must close the top sheet, then pop the stack, then switch to the Home tab, and only then leave the app.
- Predictive back (Android 13+) shows a preview of where back goes. Apps targeting newer SDKs are expected to support it ([Android predictive back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)). `react-native-screens` is adding support ([discussion](https://github.com/software-mansion/react-native-screens/discussions/2540)).
- Test that back never traps people on the paywall. Back on a paywall must close it.

---

## 3. Visual style

**Colour split: 60-30-10.** About 60% dominant background (deep indigo or near-black), 30% secondary surfaces (cards, sheets), and 10% accent (a single glowing gold or violet).
- Use the accent *only* for the primary action and active state. If the accent is everywhere, it stops guiding the eye.
- Define colours as semantic tokens (`bg`, `surface`, `surfaceRaised`, `textPrimary`, `textSecondary`, `accent`, `danger`), never as raw hex values inside components.

**Dark mode done right.** For a mystical night-time app, dark is probably the *default* theme.
- Avoid pure `#000000`. Material recommends **#121212** as the base surface because shadows and depth show up better on dark grey, and light text on grey has less halation than on black ([Material dark theme](https://m2.material.io/design/color/dark-theme)). Tinting the base toward your brand hue works well, e.g. `#0E0B1A` for indigo.
- Show elevation in dark mode by making surfaces *lighter*, about 5 to 11% white overlay per level, not by adding shadows.
- Desaturate accents a little on dark backgrounds. Fully saturated violet "vibrates" against black.
- Text tiers: primary about 87% white, secondary about 60%, disabled about 38%.

**Contrast (WCAG 2.2 AA).** Requirements: **4.5:1** for body text, **3:1** for large text (18 pt+, or 14 pt bold) and for interface parts like icons, input borders and focus rings ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).
- The classic failure in this genre is white text over a busy nebula photo. Fix it with a gradient scrim or blur behind the text.
- Check colour pairs with a contrast checker before shipping.

**Cards or flat.** Use cards where there's a collection of tappable items (sessions, playlists). Each card is one tap target with a consistent corner radius (pick one, e.g. 16 or 20, and use it everywhere). Keep reading screens and the player flat.
- Don't nest cards inside cards.

**Imagery and illustration.** This is your main point of difference. Calm built its brand on full-bleed nature photography, and Headspace on a single consistent illustration style.
- Pick **one** art direction (e.g. painterly celestial gradients, tarot-inspired line art, or soft 3D orbs) and apply it to every piece of artwork. Mixed AI art styles look cheap fast.
- Each intention category (love, money, confidence, sleep) can have its own colour family within the system.

**Icons.** Use a single icon set with the same stroke weight, corner style and grid. Phosphor and Lucide both work well with RN.
- Use filled icons for the active tab and outline for inactive. Don't mix sets.
- Use SF Symbols-style weights on iOS if you want a native feel.

**Motion.** Material 3's duration tokens run from 50 ms up to 600 ms. Typical values: about 100 to 200 ms for small state changes, **250 to 300 ms** for components, **400 to 500 ms** for full-screen transitions. Use "emphasized" easing: `cubic-bezier(0.2, 0, 0, 1)`, decelerate when entering, accelerate when exiting ([M3 easing & duration](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)).
- The Doherty threshold: respond within about **400 ms** to keep people engaged ([Laws of UX](https://lawsofux.com/doherty-threshold/)).
- Your app can use *slower, breathing* ambient motion: 4 to 8 s loops on background glows, a pulsing orb on the player. Interface feedback must still be fast.
- Use `react-native-reanimated` so animations run on the UI thread.

**Haptics.** Use haptics sparingly and to mean something. Apple's HIG says to use them consistently and not overuse them ([HIG, Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)). With `expo-haptics`:
- *light impact* on play/pause and toggles,
- *selection* on picker scroll ticks,
- *success* when a streak is extended or an affirmation is saved.
- Optionally, a gentle haptic "breath" pattern during guided breathing.
- Always respect a "Haptics off" setting.

---

## 4. Audio and meditation app specifics

**What the leaders do well.**
- **Calm:** A "Daily Calm" piece of content gives people a reason to open the app every day. It opens with ambient sound and full-bleed scenery so the app feels calming before anyone taps. It also has strong sleep features (Sleep Stories, timers, an obvious place for downloads).
- **Headspace:** Every screen uses the same illustrated, friendly character style. Content is organised by *goal* (stress, sleep, focus), and courses are structured. Onboarding asks about goals. A write-up claims that letting users pick several goals instead of one lifted trial conversion about 10% *(secondhand)* ([SozAI summary](https://sozai.app/transcript/studied-1460-onboarding-flows-findings/index.md), [teardown](https://tearthemdown.substack.com/p/headspace)).
- **Insight Timer:** A huge free library and community ("X people meditating now"). Its strongest feature is a configurable timer with interval bells.
- **Endel:** Generative audio that adapts to time, weather and heart rate. The interface is minimal: an abstract waveform on dark, plus "modes" (Focus / Relax / Sleep) instead of a content catalogue ([Endel](https://endel.io/), [screens](https://screensdesign.com/apps/endel-focus-sleep-sounds/)).
- **Innertune:** The closest competitor. A two-part quiz (emotional struggles, then habits) builds a *personalised playlist*. People choose from about 10 voices or **record in their own voice**, and pick background beats by mood. A teardown notes an aggressive paywall: early placement, no trial, and a 60% countdown discount if you dismiss it ([teardown](https://screensdesign.com/showcase/innertune-affirmations), [App Store](https://apps.apple.com/us/app/-/id6753924418)).
- **I am:** A simple text affirmation card with reminders throughout the day, plus widgets. An estimated 54M installs with a 4.8★ rating show how much "small daily dose, minimal friction" can carry an app *(third-party estimates)* ([AppGoblin](https://www.appgoblin.info/apps/874656917), [App Store](https://apps.apple.com/us/app/874656917)).

**Player screen anatomy (top to bottom):**
1. A chevron-down to collapse it, plus a ⋯ menu (share, add to playlist, download).
2. Hero artwork or a living visual (pulsing orb, slow gradient) taking up about 40 to 50% of the height.
3. Title and subtitle (intention / voice).
4. **The current affirmation as large text**, synced to the audio like karaoke lyrics. This is something special to affirmation apps: reading along reinforces the words. I am and ThinkUp lean on text, and Innertune shows the text too.
5. A scrubber with elapsed and remaining time.
6. Transport controls: −15 / **Play-Pause (big, at least 64 pt)** / +15, or loop.
7. A row of secondary controls: sleep timer ⏾, background-sound mixer (voice vs music volume, binaural beat on/off), voice picker, repeat or loop count.

**Must-have audio behaviour:**
- **Background playback and lock-screen / Control Centre controls.** With `expo-audio`, turn on `enableBackgroundPlayback` in the config plugin, set `shouldPlayInBackground: true`, and call `setActiveForLockScreen(true, metadata)`. On Android, playback is killed after about 3 minutes in the background without that call ([Expo audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)). If you need queues, gapless looping and richer media sessions, `react-native-track-player` is the more complete alternative.
- **Audio focus and interruptions.** Pause on phone calls and Siri. Resume or don't, depending on the interruption type. Pause when headphones are unplugged.
- **Mixing two layers:** voice plus a music or binaural track, with independent volumes. Binaural beats only work **with headphones**, so detect the audio route and show "Use headphones for binaural" when it's the speaker.
- **Sleep timer:** 5 / 10 / 15 / 30 / 45 / 60 min, plus "end of track". Fade out over the last 10 to 30 s. Never cut off abruptly.
- **Downloads and offline.** Show a download toggle on each track and playlist, plus a "Downloads" view under Me. Make offline playback reliable. People listen on planes and in bed with flight mode on.
- **Loop / repeat count.** Affirmations are built for repetition, so offer "repeat 3×" or "loop for 20 min".
- **Resume where I left off.**

---

## 5. Onboarding

**What converts:**
- **Personalise, then show the result.** Ask 3 to 6 questions: goal or intention (allow multi-select), current struggle, preferred voice, time of day, experience level. Then show a "building your plan…" moment that *visibly uses* the answers ("Your 7-day Confidence journey, in Aria's voice"). Personalisation questions that change nothing are a known Headspace weakness ([redesign critique](https://jenniferqian.cargo.site/headspace-redesign-1)).
- **Give value before signup.** Let people **hear a 30 to 60 s personalised affirmation** before any account or paywall. Requiring an account before value is linked to much higher day-1 churn *(secondhand)* ([Sonar](https://trysonar.app/blog/app-onboarding-that-protects-day-1-retention.md)). Use Sign in with Apple / Google later, or anonymous accounts.
- **Length.** About 5 to 10 screens total is normal in this category, and Innertune runs longer. Every screen should either personalise the plan or build the payoff. Show a progress bar. Each question gets one tap with big option cards, and an auto-advance or prominent Continue button.
- **The paywall goes at the end of onboarding.** Adapty's 2026 data: onboarding paywalls beat in-app paywalls in every configuration (with a trial, 1.35% vs 0.89%), and **71 to 95% of trial starts happen on Day 0** *(via secondary summaries)* ([Adapty State of In-App Subscriptions](https://adapty.io/state-of-in-app-subscriptions/), [Airbridge](https://www.airbridge.io/en/blog/paywall-conversion-structural-decisions)). The first session is where most of the revenue is decided.

**Permission priming (notifications).**
- Never trigger the system prompt cold on launch. iOS only lets you ask once.
- First show your own screen with the benefit ("Get your morning affirmation at 8:00"), a time picker, and an "Allow" button that *then* triggers the system dialog. Include a "Not now" option, which keeps the system ask available for later.
- About 40% of apps use a primer like this ([Lazyweb](https://www.lazyweb.com/research/percent-apps-priming-screen-before-ios-notification-prompt.md)). Vendors claim a 30 to 40% lift in opt-in *(secondhand)*.
- Letting the user pick the time is itself the strongest primer.
- Android 13+ also needs the runtime `POST_NOTIFICATIONS` permission, so the same pattern applies there.

---

## 6. Retention and habit

**Streaks.**
- The Duolingo PM who leads retention says streaks *amplify* value but can't create it. Duolingo's early streak was too complicated (tied to XP), and simplifying it to "one lesson a day" made it work ([Lenny's Newsletter](https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks)).
- For this app: **one listen = streak day.** Add a **streak freeze** (free or earned) so one missed day doesn't wipe the habit out.
- Celebrate milestones (3, 7, 30, 100) with a moment of animation and haptics, not confetti every day.

**Reminders.**
- Send them at the user-chosen time. The content should be the affirmation itself ("✨ I am worthy of what I desire"), so the notification is valuable even if it's never tapped. This is why I am works.
- Cap it at 1 to 2 a day by default, and back off when people ignore them.

**Widgets.** Duolingo's data showed widget users retained "far better", even after controlling for the fact that committed learners add widgets. Installs "skyrocketed" once they showed an in-app promo with an animated install guide after a lesson ([Duolingo blog](https://blog.duolingo.com/widget-feature)).
- An *affirmation-of-the-day* home-screen widget plus a lock-screen streak widget is a natural fit. I am's whole category is built on this.
- In Expo, use a config plugin with native WidgetKit / Glance code, e.g. `@bacons/apple-targets` for iOS.

**Daily content.** Give people one fresh thing a day: an affirmation card, a "cosmic energy of the day", or a short session ("Daily Calm" style). It gives them a reason to open the app, and a reason for the notification.

**Avoid dark patterns.**
- No guilt-trip notifications ("Your streak is dying 😢") as the default tone. A mystical, self-love brand gets hurt more than most by manipulation.
- No hidden close buttons, fake countdown timers, pre-ticked "annual" without a clear price, or cancel flows that are hard to find. Apple's guidelines and the FTC's "click-to-cancel" direction both point the same way.
- The upside of honesty: 82% of consumers say easy cancellation makes them *more* likely to subscribe ([Chargebee via BusinessWire](https://www.businesswire.com/news/home/20250923678021/en/Cancel-Anytime-Consumer-Survey-Says-Thats-Why-They-Stay)).

---

## 7. Monetisation UX

**Benchmarks (RevenueCat State of Subscription Apps 2026, via summaries)** ([report](https://www.revenuecat.com/state-of-subscription-apps), [SaaStr summary](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/)):
- **Hard paywall vs freemium:** median download-to-paid by day 35 is about **10.7% vs 2.1%**. Revenue per install at day 60 is about **$3.09 vs $0.38**. One-year retention of annual subscribers is almost the same (27% vs 28%), so the hard paywall's advantage comes from converting more people up front ([Airbridge](https://www.airbridge.io/en/blog/hard-paywall-vs-freemium-2026)).
- **Trial length:** trials of 17 to 32 days convert at a 42.5% median, vs 25.5% for trials under 4 days.
- **Health & Fitness plan mix:** annual makes up about **60%** of category revenue, while weekly dominates other categories. Annual subscribers keep about 44% at 12 months vs about 17.5% for monthly. Category medians are about $9.70/month and $39.99/year *(secondhand, 2025 data)* ([Adapty](https://adapty.io/blog/weekly-monthly-annual-subscription-plan/), [Airbridge pricing](https://www.airbridge.io/en/blog/subscription-app-pricing-by-category-2026-benchmark)).
- Adapty: soft (dismissible) paywalls convert about 50% better from view to payment. Hard paywalls show about 21% higher one-year LTV.

**Recommended structure for this app:**
- Make the onboarding paywall **dismissible** with a clear ✕ after a short delay of 1 to 2 s, not hidden. After that, the app is **freemium**: daily affirmation, a few free tracks, and a capped number of custom affirmations.
- Gate the things people really want: your own voice, all voices, unlimited custom playlists, downloads, binaural layers. Show soft-paywall moments *in context* (tap a locked voice, then a sheet explains it). Test a hard paywall later with paid traffic.

**Paywall design that works:**
- Headline about the *outcome* ("Rewire your mindset in 7 days"), not about features.
- 3 to 4 benefit bullets with icons. Social proof (rating, review quote).
- Two plans: **Annual, preselected, with "Save 60%"** and a per-week or per-month equivalent price, vs **Monthly** as the anchor that makes annual look cheap. Optionally a lifetime plan as a high anchor.
- A **trial timeline** ("Today: full access → Day 5: we remind you → Day 7: billed"). Blinkist reported +23% trial starts and fewer cancellations after adding a timeline plus a reminder *(secondhand; one indie copy saw about 4%)* ([UX Planet](https://uxplanet.org/how-solving-our-biggest-customer-complaint-at-blinkist-led-to-a-23-increase-in-conversion-b60ad514134b)). Actually send that reminder.
- The CTA reads "Start my free week" or "Try free for 7 days". Show the price clearly near the CTA (Apple requires this). Add Restore purchases, Terms and Privacy links.
- Use RevenueCat Paywalls or Superwall so you can A/B test price and copy without app releases.

**Gen Z specifics.**
- They're heavy subscribers but quick to churn. 37% of 18–29 streaming subscribers cancelled at least one service because of subscription fatigue ([NewscastStudio / CivicScience](https://www.newscaststudio.com/2026/01/28/gen-z-reports-high-subscription-fatigue-despite-maintaining-multiple-streaming-services)).
- What they tolerate: transparent pricing, a real free tier, easy cancellation, and fair "student" or intro pricing.
- What backfires: fake scarcity timers (Innertune's 60%-off countdown might convert but invites 1-star "scam" reviews), surprise charges, and paywalls before any value.
- A low-priced **weekly** option converts well generally but retains badly. For a habit app, push annual.

---

## 8. Accessibility and performance

- **Dynamic Type / font scaling.** Don't set `allowFontScaling={false}` everywhere. Let text scale (cap it with `maxFontSizeMultiplier` about 1.5 to 2 on dense controls). Test at the largest size. Layouts should wrap, not truncate.
- **Screen readers.** Every icon button needs an `accessibilityLabel` ("Play", "Sleep timer, 30 minutes"). Give the scrubber `accessibilityRole="adjustable"` with increment and decrement actions. Group card contents so they're read once. Test with VoiceOver and TalkBack.
- **Reduced motion.** Check `AccessibilityInfo.isReduceMotionEnabled()` (Reanimated has `useReducedMotion`). Swap parallax, zooms and pulsing orbs for fades. I am lists "Reduced Motion" and "Sufficient Contrast" in its App Store accessibility labels, so declare yours too.
- **Colour.** Never use colour as the only signal, e.g. a locked track needs a lock icon, not just grey.
- **Response time.** Response time limits are 0.1 s (feels instant), 1 s (flow kept), 10 s (attention lost) ([NN/g](https://www.nngroup.com/videos/3-response-time-limits-interaction-design/)).
  - Pressing Play should give *visual* feedback in under 100 ms, even while audio buffers. Swap to a loading ring on the button itself.
  - Skeletons help for waits of about 1 to 10 s. Evidence on whether they *feel* faster is mixed, so don't use them to hide slow loads.
- **Audio start.** Stream with progressive download. Pre-cache today's affirmation and the next track. Cache artwork (`expo-image` with a blurhash placeholder).
- **Startup.** Aim for **under 2 s** to the first useful screen on a mid-range Android. Keep the splash screen to branding only, with no carousels before the first frame. Use Hermes (the default) and lazy-load routes.
- **App size.** Don't bundle audio. Stream or download it. Keep the install under about 50 to 80 MB. Large downloads lose installs on cellular connections and lower-end Android phones.
- **Web.** Expo web works for marketing and web checkout, but treat it as a secondary platform. Test the player there separately, since browser autoplay rules need a user gesture before audio starts.

---

## 9. Store presence

**Screenshots.** People decide in a few seconds, and the **first 3 screenshots** (visible without scrolling) carry most of the weight *(vendor claims of 70 to 80%)* ([AppTweak](https://www.apptweak.com/en/aso-blog/how-to-optimize-your-app-screenshots), [AppFollow](https://appfollow.io/blog/aso-screenshots-best-practices)).
1. The hook: a big benefit caption over the player with your art ("Affirmations in *your* voice").
2. Personalisation: "Built for your goals: love, money, confidence".
3. A differentiator: "Binaural beats + sleep timer" or a widget shot.

Use short captions (≤ 5 words), high contrast, and the same art direction as the app. Use App Store Product Page Optimization and Play Store listing experiments to A/B test.

**Icon.**
- One simple, bold shape that reads at 29 pt and on a busy wallpaper (moon, eye, orb, star sigil). No words and no photo.
- Pick a distinct colour that stands out from Calm (blue) and Headspace (orange). A violet-gold gradient is crowded in this niche, so check what's already there.
- Provide iOS 18+ dark and tinted variants, and an Android adaptive / themed (monochrome) icon ([HIG, App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)).

**Naming.** The App Store title is 30 characters and the subtitle 30 more. Keep the brand short and searchable: "Brand: Manifest Affirmations" to capture keywords like *affirmations*, *manifestation*, *law of attraction*. Check trademarks and existing listings.

**Ratings prompt.**
- iOS shows the native prompt at most **3 times per 365 days**, and the system decides whether it appears at all ([guide](https://www.avanderlee.com/swift/skstorereviewcontroller-app-ratings/); [Apple docs](https://developer.apple.com/documentation/storekit/requesting-app-store-reviews)).
- Ask only after a positive moment: a completed session, or a 3- or 7-day streak milestone. Ask after several sessions, never during onboarding, and never from a button tap.
- Don't incentivise reviews or ask "do you like us?" first only to route unhappy users away. Apple prohibits both.
- Use `expo-store-review`.

**Featuring.** Submit Featuring Nominations in App Store Connect at least 2 weeks ahead, and ideally up to 3 months, for launches and big updates ([Apple, Getting featured](https://developer.apple.com/app-store/getting-featured)). Editors favour polish, accessibility, localisation and use of new Apple tech, so widgets, Live Activities for a playing session, and Dynamic Type support all count.

---

## 10. Checklist and top 10 improvements

### Quick checklist (apply screen by screen)
- [ ] One obvious primary action, filled accent, in the bottom third.
- [ ] All tap targets ≥ 48 pt/dp. Icons have padding or `hitSlop`.
- [ ] Spacing only from the 4/8 scale. 16 pt side margins. Same corner radius everywhere.
- [ ] Two font families at most, 3 weights, body ≥ 16 pt. Text scales with system settings.
- [ ] Text contrast ≥ 4.5:1 (check text over artwork). Icons and controls ≥ 3:1.
- [ ] Dark theme on tinted near-black, not #000. Accent used for about 10% of the screen.
- [ ] Safe areas respected. Android edge-to-edge. Mini-player clears the home indicator.
- [ ] Android back closes sheet → pops stack → goes Home → exits. Back closes the paywall.
- [ ] Every icon button has an accessibility label. Reduced motion respected. Haptics can be turned off.
- [ ] Tap feedback under 100 ms. Audio starts in about 1 s or shows a loading state on the button.
- [ ] Audio keeps playing locked or in the background, with lock-screen controls, interruption handling and a sleep timer with fade.
- [ ] Paywall: clear ✕, price near the CTA, trial timeline, Restore, Terms, Privacy.
- [ ] No dark patterns: no fake timers, no guilt notifications, cancelling is easy to find.

### The 10 highest-leverage improvements for an affirmations audio app
1. **Personalised first listen before any signup or paywall.** A quiz feeds a 30 to 60 s affirmation track in the chosen voice and intention, which plays straight away. This is where most of the conversion is decided (most trials start on Day 0).
2. **Record in your own voice**, plus a small set of premium AI or professional voices. It's Innertune's headline feature and the most "magical" moment in the category. Make it the core premium unlock.
3. **A honest, well-designed onboarding paywall** (dismissible, annual preselected with monthly as anchor, trial timeline plus a real reminder). Then soft paywalls in context. A/B test with RevenueCat or Superwall.
4. **An affirmation-of-the-day home-screen and lock-screen widget.** It gives a daily touchpoint without opening the app. This is I am's engine, and Duolingo's data supports it.
5. **A rock-solid background audio stack:** lock-screen controls, interruptions, offline downloads, a sleep timer with fade-out, loop or repeat count. Bugs here are the top 1-star complaint for audio apps.
6. **A two-layer mixer** (voice + music / binaural / nature) with separate volume sliders, and a headphone check for binaural.
7. **A mini-player plus a full player with read-along affirmation text.** Synced text reinforces the message and suits Gen Z, who often listen with the sound low.
8. **A simple, forgiving streak** (1 listen = 1 day, with streak freezes) and milestone celebrations with haptics. No guilt copy.
9. **Notification reminders that *are* the content,** at a time the user picks during a primed onboarding step, capped at 1 to 2 a day.
10. **One consistent mystical art direction plus a polished store page:** a single illustration or gradient system, a distinctive icon with dark and tinted variants, 3 hook screenshots, and a ratings prompt only after positive milestones.
