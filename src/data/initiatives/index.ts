import { Initiative } from "@/types/initiative";

export const initiatives: Initiative[] = [
  {
    slug: "safer-urban-feeders",
    title: "Safer Urban Bird Feeders",
    tagline: "Open-source designs that protect birds from injury and disease",
    status: "example",
    isExample: true,
    problem:
      "Many commercial bird feeders cause injuries, spread disease, or attract predators. Birds deserve feeding solutions designed with their safety as the priority.",
    description:
      "This initiative aims to research, design, and openly share bird feeder designs that minimize common risks: sharp edges, disease transmission, predator exposure, and weather damage.",
    goals: [
      "Research common feeder-related injuries and diseases",
      "Design safer alternatives with community input",
      "Publish open-source designs anyone can build",
      "Partner with ethical manufacturers for accessible options",
    ],
  },
  {
    slug: "window-collision-prevention",
    title: "Window Collision Prevention",
    tagline: "Reducing the millions of bird deaths from glass strikes",
    status: "example",
    isExample: true,
    problem:
      "Hundreds of millions of birds die annually from window collisions. Most people don't know this happens or how to prevent it.",
    description:
      "This initiative focuses on raising awareness about window collisions and providing affordable, effective solutions that anyone can implement at home or work.",
    goals: [
      "Create educational content about the problem",
      "Test and recommend affordable prevention methods",
      "Develop easy-to-follow installation guides",
      "Advocate for bird-safe building standards",
    ],
  },
  {
    slug: "clean-water-access",
    title: "Clean Water Access",
    tagline: "Simple water stations for urban birds",
    status: "example",
    isExample: true,
    problem:
      "Urban environments often lack clean water sources. Birds struggle to find hydration, especially during hot summers.",
    description:
      "This initiative develops simple, hygienic water station designs that anyone can set up and maintain, ensuring birds have access to clean drinking water.",
    goals: [
      "Design low-maintenance water stations",
      "Create cleaning and maintenance guides",
      "Research optimal placement strategies",
      "Build a network of water station locations",
    ],
  },
];

export function getInitiativeBySlug(slug: string): Initiative | undefined {
  return initiatives.find((i) => i.slug === slug);
}

export function getInitiativesByStatus(status: string): Initiative[] {
  return initiatives.filter((i) => i.status === status);
}

export function getActiveInitiatives(): Initiative[] {
  return initiatives.filter((i) => i.status === "active" || i.status === "example");
}

export function getCompletedInitiatives(): Initiative[] {
  return initiatives.filter((i) => i.status === "completed");
}
