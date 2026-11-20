import { db } from "../src/lib/db";

const names = ["Aarav","Ananya","Kabir","Meera","Rohan","Isha","Vihaan","Diya","Arjun","Saanvi","Reyansh","Tara","Ishaan","Kiara","Advait","Myra","Dev","Anika","Neil","Riya","Samar","Zoya","Yash","Nisha","Veer","Aditi","Karan","Naina","Aryan","Sana","Mihir","Pari"];
const places = ["IIT Delhi","DU North Campus","Gurgaon","Noida","Ashoka University","Jamia Millia Islamia","Christ University, Bengaluru","BITS Pilani","Mumbai","Pune","Hyderabad","JNU"];
const pool = ["Music","Travel","Cricket","Coding","Photography","Movies","Fitness","Cooking","Reading","Gaming","Art","Hiking","Stand-up comedy","Football","Dance","Coffee"];
const bios = [
  "Chai over coffee, always.",
  "Will trade my playlist for yours.",
  "Weekend hikes and bad puns.",
  "Part-time foodie, full-time overthinker.",
  "Ask me about my favourite movie.",
  "Always up for a late-night walk.",
  "Learning guitar, badly but happily.",
  "Looking for someone to split dessert with.",
];

const insertProfile = db.prepare(
  "INSERT INTO profiles (id, name, age, photo, bio, location, interests) VALUES (?, ?, ?, ?, ?, ?, ?)"
);
const insertLike = db.prepare("INSERT INTO likes_me (profile_id) VALUES (?)");

db.transaction(() => {
  db.exec("DELETE FROM matches; DELETE FROM swipes; DELETE FROM likes_me; DELETE FROM profiles;");
  names.forEach((name, i) => {
    const id = i + 1;
    const interests = [0, 5, 10, 15].map((k) => pool[(i * 3 + k) % pool.length]);
    insertProfile.run(
      id,
      name,
      19 + (i % 8),
      `https://i.pravatar.cc/600?img=${id}`,
      bios[i % bios.length],
      places[i % places.length],
      JSON.stringify(interests)
    );
    if (i % 3 === 0) insertLike.run(id); // 11 profiles already like the user
  });
})();

console.log(`Seeded ${names.length} profiles, ${Math.ceil(names.length / 3)} pre-liked the user.`);