import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { getFeed, getMatches, recordSwipe, SwipeError } from "./swipe";

beforeEach(() => {
  db.exec("DELETE FROM matches; DELETE FROM swipes; DELETE FROM likes_me; DELETE FROM profiles;");
  const ins = db.prepare(
    "INSERT INTO profiles (id, name, age, photo, bio, location, interests) VALUES (?, ?, 21, 'x', 'bio', 'Delhi', '[\"Music\"]')"
  );
  ins.run(1, "A");
  ins.run(2, "B");
  ins.run(3, "C");
  db.prepare("INSERT INTO likes_me (profile_id) VALUES (1)").run(); // A already liked the user
});

describe("feed", () => {
  it("returns every profile that has not been swiped on", () => {
    expect(getFeed().map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("never exposes who liked the user", () => {
    const json = JSON.stringify(getFeed());
    expect(json).not.toMatch(/likes_me|likedMe|likesMe/i);
    expect(Object.keys(getFeed()[0]).sort()).toEqual(
      ["age", "bio", "id", "interests", "location", "name", "photo"]
    );
  });

  it("never shows a swiped profile again, for likes or passes", () => {
    recordSwipe(1, "like");
    recordSwipe(2, "pass");
    expect(getFeed().map((p) => p.id)).toEqual([3]);
  });
});

describe("matching", () => {
  it("creates a match when both sides liked", () => {
    const res = recordSwipe(1, "like");
    expect(res.matched).toBe(true);
    expect(res.profile?.name).toBe("A");
    expect(getMatches().map((p) => p.id)).toEqual([1]);
  });

  it("does not create a match for a one-sided like", () => {
    const res = recordSwipe(2, "like");
    expect(res).toEqual({ matched: false, alreadySwiped: false });
    expect(getMatches()).toEqual([]);
  });

  it("does not create a match when the user passes on someone who liked them", () => {
    expect(recordSwipe(1, "pass").matched).toBe(false);
    expect(getMatches()).toEqual([]);
  });

  it("keeps the first swipe: pass then like cannot create a match", () => {
    recordSwipe(1, "pass");
    expect(recordSwipe(1, "like").matched).toBe(false);
    expect(getMatches()).toEqual([]);
  });

  it("is idempotent: a double like creates exactly one match", () => {
    recordSwipe(1, "like");
    const second = recordSwipe(1, "like");
    expect(second.alreadySwiped).toBe(true);
    expect(second.matched).toBe(true);
    expect(getMatches()).toHaveLength(1);
    expect(db.prepare("SELECT COUNT(*) c FROM swipes").get()).toEqual({ c: 1 });
  });

  it("rejects an unknown profile", () => {
    expect(() => recordSwipe(999, "like")).toThrow(SwipeError);
  });
});