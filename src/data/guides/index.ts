import { Guide, GuideCategories } from "@/types/knowledge";

export const guideCategories: GuideCategories = {
  feeding: {
    title: "Feeding Birds",
    description: "Safe nutrition and feeding practices",
    icon: "Utensils",
  },
  shelter: {
    title: "Shelter & Nesting",
    description: "Creating safe spaces for birds",
    icon: "Home",
  },
  seasonal: {
    title: "Seasonal Care",
    description: "Adapting care through the year",
    icon: "Sun",
  },
  urban: {
    title: "Urban Birds",
    description: "Helping birds in city environments",
    icon: "Building",
  },
  health: {
    title: "Health & Wellness",
    description: "Keeping birds healthy",
    icon: "Heart",
  },
  safety: {
    title: "Safety & First Aid",
    description: "Protecting birds from harm",
    icon: "Shield",
  },
};

export const guides: Guide[] = [
  {
    slug: "feeding-basics",
    title: "Feeding Basics",
    category: "feeding",
    summary: "Essential principles for safely feeding birds",
    isReady: false,
  },
  {
    slug: "water-and-hydration",
    title: "Water & Hydration",
    category: "feeding",
    summary: "Providing clean water for birds",
    isReady: false,
  },
  {
    slug: "safe-bird-feeders",
    title: "Safe Bird Feeders",
    category: "feeding",
    summary: "Choosing and maintaining feeders that protect birds",
    isReady: false,
  },
  {
    slug: "nesting-boxes",
    title: "Nesting Boxes",
    category: "shelter",
    summary: "Building and placing safe nesting spaces",
    isReady: false,
  },
  {
    slug: "winter-shelter",
    title: "Winter Shelter",
    category: "shelter",
    summary: "Helping birds survive cold weather",
    isReady: false,
  },
  {
    slug: "summer-care",
    title: "Summer Care",
    category: "seasonal",
    summary: "Heat protection and hydration in warm months",
    isReady: false,
  },
  {
    slug: "winter-care",
    title: "Winter Care",
    category: "seasonal",
    summary: "Nutrition and shelter during cold months",
    isReady: false,
  },
  {
    slug: "urban-bird-challenges",
    title: "Urban Bird Challenges",
    category: "urban",
    summary: "Understanding threats birds face in cities",
    isReady: false,
  },
  {
    slug: "window-collision-prevention",
    title: "Window Collision Prevention",
    category: "safety",
    summary: "Protecting birds from glass strikes",
    isReady: false,
  },
  {
    slug: "injured-bird-first-response",
    title: "Injured Bird First Response",
    category: "safety",
    summary: "What to do when you find an injured bird",
    isReady: false,
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: string): Guide[] {
  return guides.filter((g) => g.category === category);
}
