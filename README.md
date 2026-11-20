# Coy Discover

A swipe-based "Discover" tab for Coy, built for the Coy SDE Intern assignment. It is a standalone Next.js app with a placeholder **Home** tab (intentionally blank, as specified) and a fully working **Discover** tab.

The core promise of Coy is kept throughout: **a like is never revealed unless it is mutual.**

## Quick start

Requires Node.js 20.9 or later.

```bash
git clone https://github.com/shreeiya17/coy-discover.git
cd coy-discover
npm install
npm run dev
```

Open http://localhost:3000 (best viewed in a mobile viewport: DevTools, then the device toolbar).

The database is created and seeded automatically on first run. No other setup is needed. If the native SQLite module fails to load, run `npm rebuild better-sqlite3`.

Other commands:

```bash
npm test        # unit tests for the matching and privacy logic
npm run seed    # reset the database to the seed data
```

## Demo walkthrough

1. The first card is Aarav, who has already liked you. Swipe right (or press the heart, or the right arrow key) and you get the **It's a match!** screen.
2. Swipe left on anyone to pass. Use drag on mobile, the buttons on desktop, or the arrow keys.
3. Open the **Matches** toggle to see all mutual matches.
4. Reload the page. Swipes and matches persist, and swiped profiles never return.
5. Swipe through everyone to see the empty state. **Reset demo data** refills the feed.

The seed data has 32 profiles. **11 of them have already liked you** (every third profile starting from the first), so a maximum of 11 matches is possible in a demo.

## Features

- Mobile-first swipe cards with drag gestures, rotation, LIKE and PASS stamps, and a card stack
- Buttons and keyboard arrows for desktop
- "It's a match!" screen shown at the moment of a mutual like
- Matches view listing only mutual matches
- Clear empty state, loading state and error handling (a failed swipe puts the card back)
- Persistence with SQLite

## API

| Method | Path | Description |
|---|---|---|
| GET | `/feed` | Profiles the user has not yet swiped on |
| POST | `/swipe` | Records a like or pass. Body: `{ "profileId": 1, "direction": "like" }` |
| GET | `/matches` | The user's mutual matches |
| POST | `/api/reset` | Demo helper: clears swipes and matches (keeps the seed data) |

Every endpoint is also available under `/api/...` (for example `/api/feed`).

`POST /swipe` returns `{ "matched": boolean, "alreadySwiped": boolean, "profile"?: Profile }`. The profile is included only when `matched` is true. Invalid bodies return 400, and an unknown profile returns 404.

```bash
curl -s localhost:3000/feed
curl -s -X POST localhost:3000/swipe -H 'content-type: application/json' -d '{"profileId":1,"direction":"like"}'
curl -s localhost:3000/matches
```

## Privacy design

This is the part of the assignment I treated as most important.

- **Seeded likes live in a separate server-side table (`likes_me`)** that no query used by an API ever returns. Profile objects have no "likes you" field at all.
- **`/feed` returns the same shape for everyone**, so the response cannot reveal who has liked the user.
- **`/swipe` reveals a like only when it becomes a match.** A pass, or a like on someone who has not liked the user, returns the same `matched: false`, so the response cannot be used to probe.
- **The first swipe wins.** Swiping on a profile again never changes the outcome, so passing and then liking cannot be used to discover who liked the user.
- A unit test asserts that the feed contains no like-related data and that the profile shape is fixed.

## Backend design

- **SQLite via better-sqlite3**, with a primary key on `swipes.profile_id`, so a profile can be swiped on only once.
- **Swipes run in an immediate transaction**: the swipe and the match are written atomically, and concurrent requests cannot create duplicate matches.
- Swipes are **idempotent**: a repeated swipe returns the original outcome with `alreadySwiped: true`.
- Request bodies are validated with **zod**.
- The database seeds itself on first run, and `npm run seed` resets it.

```
src/lib/db.ts        schema and connection
src/lib/seed.ts      32 mock profiles, 11 pre-liked
src/lib/swipe.ts     feed, swipe, matches logic (pure of HTTP)
src/lib/swipe.test.ts  9 tests: matching rules, idempotency, privacy
src/app/api/*        thin route handlers
src/components/*     Discover tab, swipe card, match screen
```

## Tests

`npm test` runs 9 Vitest tests against an in-memory database. They cover: only unswiped profiles in the feed, swiped profiles never returning, no like data in the feed, match on mutual like, no match on a one-sided like, no match after a pass, first swipe wins, idempotent double like, and an unknown profile.

## Assumptions and limitations

- A single logged-in user, with no authentication, as the assignment allows.
- Photos are placeholder images from pravatar.cc, with an initial-letter fallback if they fail to load.
- With more time I would add real auth and multi-user support, pagination for large feeds, and rate limiting on `/swipe`.

---

# Part A: Two core features I would add to Coy

I used Coy end to end: the walkthrough, adding crushes, the anonymous heads-up, Settings, the extra-slots screen and the invite link. The onboarding is smooth, so my suggestions target the gaps I found in the core experience.

## 1. Edit and remove crushes (slot recycling)

**What I observed:** tapping a crush offers no way to edit or remove it. With 3 of 3 slots used, the slot stays locked.

**Why it is required:** a mistyped number or a change of mind permanently wastes one of only 3 free slots. That makes the most important action in the app, adding a crush, feel risky, which suppresses adds. Fewer adds means fewer heads-ups, fewer matches and fewer paid slots.

**How I would build it:** allow remove or replace with a cooldown (for example one change per slot per 30 days) and a daily cap, so the feature cannot be used to probe many numbers. Removing a crush never retracts a heads-up that was already sent, and a replaced number is treated as a brand new add, so nothing is revealed.

**Trade-off:** swapping could reduce paid slot purchases, so the cooldown limits it. Free slots that go to the right person should lift matches, which is the metric that matters.

## 2. Separate alert controls and a block list (safety)

**What I observed:** Settings has a single Alerts toggle covering both new-add heads-ups and matches. There is no way to block anyone.

**Why it is required:** an anonymous heads-up is a message from an unknown sender, and recipients cannot stop it. Turning Alerts off also silences match notifications, which are the alerts people want. Coy's value is trust, so one bad experience with an unwanted heads-up damages the whole promise.

**How I would build it:** separate toggles for heads-ups and matches. Add a block list by number, where a blocked add looks identical to a normal add for the sender, so blocking reveals nothing. Limit each sender and recipient pair to one heads-up, so repeated re-adds cannot be used to spam.

**Success metric:** opt-out rate of Alerts, and the number of block events per 1,000 heads-ups.