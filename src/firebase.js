import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_MwjkY8sYigLrqTtyqW3T5V-AOVS8pIQ",
  authDomain: "camping-planner-bdf2d.firebaseapp.com",
  projectId: "camping-planner-bdf2d",
  storageBucket: "camping-planner-bdf2d.firebasestorage.app",
  messagingSenderId: "949161879549",
  appId: "1:949161879549:web:495c8d66c375a17739db94",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const NC = { SaMeg: false, PraKrithi: false, NagKav: false };

const SEED_GEAR = [
  { item: "Tent (6-person)", assignedTo: "NagKav", addedBy: "NagKav", packed: false, confirmed: NC },
  { item: "Sleeping bags x3", assignedTo: "SaMeg", addedBy: "SaMeg", packed: false, confirmed: NC },
  { item: "Camp stove", assignedTo: "PraKrithi", addedBy: "PraKrithi", packed: false, confirmed: NC },
  { item: "Lanterns", assignedTo: "NagKav", addedBy: "NagKav", packed: false, confirmed: NC },
  { item: "First aid kit", assignedTo: "SaMeg", addedBy: "SaMeg", packed: false, confirmed: NC },
  { item: "Hiking boots", assignedTo: "PraKrithi", addedBy: "PraKrithi", packed: false, confirmed: NC },
];
const SEED_MEALS = [
  { day: "Day 1 (Apr 4)", meal: "Dinner", name: "Hot dogs & s'mores", chef: "NagKav", confirmed: NC },
  { day: "Day 2 (Apr 5)", meal: "Breakfast", name: "Pancakes & bacon", chef: "SaMeg", confirmed: NC },
  { day: "Day 2 (Apr 5)", meal: "Dinner", name: "Foil packet veggies & chicken", chef: "PraKrithi", confirmed: NC },
  { day: "Day 3 (Apr 6)", meal: "Breakfast", name: "Scrambled eggs & toast", chef: "SaMeg", confirmed: NC },
  { day: "Day 3 (Apr 6)", meal: "Dinner", name: "Campfire chili", chef: "NagKav", confirmed: NC },
];
const SEED_GROCERIES = [
  { item: "Potatoes", qty: "1 kg", category: "Vegetables", forMeal: "Foil packet veggies & chicken", addedBy: "PraKrithi", bought: false, confirmed: NC },
  { item: "Zucchini", qty: "3 pcs", category: "Vegetables", forMeal: "Foil packet veggies & chicken", addedBy: "PraKrithi", bought: false, confirmed: NC },
  { item: "Chicken thighs", qty: "1.5 kg", category: "Meat & Seafood", forMeal: "Foil packet veggies & chicken", addedBy: "NagKav", bought: false, confirmed: NC },
  { item: "Eggs", qty: "12", category: "Dairy", forMeal: "Scrambled eggs & toast", addedBy: "SaMeg", bought: false, confirmed: NC },
  { item: "Bread loaf", qty: "1", category: "Dry & Pantry", forMeal: "Scrambled eggs & toast", addedBy: "SaMeg", bought: false, confirmed: NC },
  { item: "Hot dogs", qty: "2 packs", category: "Meat & Seafood", forMeal: "Hot dogs & s'mores", addedBy: "NagKav", bought: false, confirmed: NC },
  { item: "Pancake mix", qty: "1 box", category: "Dry & Pantry", forMeal: "Pancakes & bacon", addedBy: "SaMeg", bought: false, confirmed: NC },
  { item: "Bacon", qty: "500g", category: "Meat & Seafood", forMeal: "Pancakes & bacon", addedBy: "SaMeg", bought: false, confirmed: NC },
];
const SEED_ACTIVITIES = [
  { name: "Lake swimming", day: "Day 1 (Apr 4)", suggestedBy: "SaMeg", votes: 4, votedBy: [] },
  { name: "Bush walking trail", day: "Day 2 (Apr 5)", suggestedBy: "NagKav", votes: 3, votedBy: [] },
  { name: "Stargazing night", day: "Day 2 (Apr 5)", suggestedBy: "PraKrithi", votes: 5, votedBy: [] },
  { name: "Canoe / kayaking", day: "Day 3 (Apr 6)", suggestedBy: "SaMeg", votes: 4, votedBy: [] },
];

// SAFE seed: only adds missing items by name — never deletes existing data
export async function seedIfEmpty(colName, seeds, nameField = "name") {
  const snap = await getDocs(collection(db, colName));
  if (snap.empty) {
    // Collection is completely empty — seed everything
    for (const s of seeds) await addDoc(collection(db, colName), s);
  }
  // If collection has data, leave it completely alone
}

export async function seedAll() {
  await Promise.all([
    seedIfEmpty("gear", SEED_GEAR, "item"),
    seedIfEmpty("meals", SEED_MEALS, "name"),
    seedIfEmpty("groceries", SEED_GROCERIES, "item"),
    seedIfEmpty("activities", SEED_ACTIVITIES, "name"),
  ]);
}

export { collection, onSnapshot };
