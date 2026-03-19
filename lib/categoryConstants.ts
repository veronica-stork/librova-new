// lib/constants.ts

export interface Category {
  id: number;
  name: string;
}

// IMPORTANT: If you change these IDs, you MUST update categorization.py and the Neon database.
export const CATEGORIES: Category[] = [
  { id: 1, name: "Storytime" },
  { id: 2, name: "Crafts" },
  { id: 3, name: "Book Talks" },
  { id: 4, name: "Games" },
  { id: 5, name: "History" },
  { id: 6, name: "Health" },
  { id: 7, name: "STEM" },
  { id: 8, name: "Teens" },
  { id: 9, name: "Adults" },
  { id: 10, name: "Family" },
  { id: 11, name: "Children" },
  { id: 12, name: "Early Childhood" },
  { id: 13, name: "Tech Help" },
  { id: 14, name: "Special Needs" },
  { id: 15, name: "Languages" },
  { id: 16, name: "Music" },
  { id: 17, name: "Money" },
  { id: 18, name: "Gardening" },
  { id: 19, name: "Cooking" },
  { id: 20, name: "Literacy" },
  { id: 21, name: "Movies" },
  { id: 22, name: "Virtual" },
  { id: 23, name: "Seniors" },
  { id: 24, name: "LGBTQ" },
  { id: 25, name: "Book Clubs"}
];

// Helper to quickly get a name by ID: e.g., CATEGORY_MAP[21] -> "Movies"
export const CATEGORY_MAP: Record<number, string> = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.name;
  return acc;
}, {} as Record<number, string>);

// Most common filters 
export const QUICK_FILTER_IDS = [12, 11, 10, 9, 8, 1, 7, 25];