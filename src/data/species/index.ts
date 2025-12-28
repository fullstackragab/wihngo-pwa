import { Species } from "@/types/knowledge";

export const species: Species[] = [
  {
    slug: "house-sparrow",
    commonName: "House Sparrow",
    scientificName: "Passer domesticus",
    description: "One of the most common birds worldwide, often found near human habitation.",
    isReady: false,
  },
  {
    slug: "european-robin",
    commonName: "European Robin",
    scientificName: "Erithacus rubecula",
    description: "A small bird known for its distinctive red breast.",
    isReady: false,
  },
  {
    slug: "common-pigeon",
    commonName: "Common Pigeon",
    scientificName: "Columba livia",
    description: "Urban-adapted birds found in cities worldwide.",
    isReady: false,
  },
  {
    slug: "domestic-chicken",
    commonName: "Domestic Chicken",
    scientificName: "Gallus gallus domesticus",
    description: "The most common domesticated bird, deserving of compassionate care.",
    isReady: false,
  },
  {
    slug: "common-blackbird",
    commonName: "Common Blackbird",
    scientificName: "Turdus merula",
    description: "A familiar garden bird with a beautiful song.",
    isReady: false,
  },
];

export function getSpeciesBySlug(slug: string): Species | undefined {
  return species.find((s) => s.slug === slug);
}
