import { db } from "../src/lib/db";
import { seedProfiles } from "../src/lib/seed";

const r = seedProfiles(db);
console.log(`Seeded ${r.profiles} profiles, ${r.likedMe} pre-liked the user.`);