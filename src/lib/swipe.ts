import { db } from "./db";

export type Profile = {
  id: number;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[];
};
export type Direction = "like" | "pass";
export type SwipeResult = { matched: boolean; alreadySwiped: boolean; profile?: Profile };

export class SwipeError extends Error {
  constructor(public code: "NOT_FOUND", message: string) {
    super(message);
  }
}

type ProfileRow = Omit<Profile, "interests"> & { interests: string };
const toProfile = (r: ProfileRow): Profile => ({ ...r, interests: JSON.parse(r.interests) });

const selectProfile = db.prepare("SELECT * FROM profiles WHERE id = ?");
const selectSwipe = db.prepare("SELECT direction FROM swipes WHERE profile_id = ?");
const insertSwipe = db.prepare("INSERT INTO swipes (profile_id, direction) VALUES (?, ?)");
const likedMe = db.prepare("SELECT 1 FROM likes_me WHERE profile_id = ?");
const insertMatch = db.prepare("INSERT INTO matches (profile_id) VALUES (?)");
const selectMatch = db.prepare("SELECT 1 FROM matches WHERE profile_id = ?");

// The feed never selects from likes_me, so a like can never leak through it.
export function getFeed(limit = 50): Profile[] {
  const rows = db
    .prepare("SELECT * FROM profiles WHERE id NOT IN (SELECT profile_id FROM swipes) ORDER BY id LIMIT ?")
    .all(limit) as ProfileRow[];
  return rows.map(toProfile);
}

const swipeTx = db.transaction((profileId: number, direction: Direction): SwipeResult => {
  const row = selectProfile.get(profileId) as ProfileRow | undefined;
  if (!row) throw new SwipeError("NOT_FOUND", `Profile ${profileId} does not exist`);

  // Idempotent: the first swipe wins, repeats never change the outcome.
  if (selectSwipe.get(profileId)) {
    const matched = !!selectMatch.get(profileId);
    return { matched, alreadySwiped: true, ...(matched ? { profile: toProfile(row) } : {}) };
  }

  insertSwipe.run(profileId, direction);

  // A match exists only when both sides liked. Passes and one-sided likes reveal nothing.
  if (direction === "like" && likedMe.get(profileId)) {
    insertMatch.run(profileId);
    return { matched: true, alreadySwiped: false, profile: toProfile(row) };
  }
  return { matched: false, alreadySwiped: false };
});

export function recordSwipe(profileId: number, direction: Direction): SwipeResult {
  return swipeTx.immediate(profileId, direction);
}

export function getMatches(): Profile[] {
  const rows = db
    .prepare("SELECT p.* FROM matches m JOIN profiles p ON p.id = m.profile_id ORDER BY m.created_at DESC")
    .all() as ProfileRow[];
  return rows.map(toProfile);
}

// Demo helper so reviewers can replay the flow. Keeps the seeded likes_me data.
export function resetDemo() {
  db.exec("DELETE FROM matches; DELETE FROM swipes;");
}