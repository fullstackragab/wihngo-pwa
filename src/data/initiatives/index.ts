import { Initiative } from "@/types/initiative";

export const initiatives: Initiative[] = [
  {
    slug: "free-coexistence",
    title: "Free Coexistence with Birds",
    titleAr: "التعايش الحر مع الطيور",
    tagline: "Rethinking home environments to serve birds, not change them",
    taglineAr: "إعادة تصميم البيئة لتخدم الطيور دون تغييرها",
    status: "active",
    isExample: false,
    problem:
      "Most solutions for living with birds at home focus on restricting the bird, training it, or forcing it to adapt to human lifestyles. The question is rarely asked the other way: How can we change the environment to serve the bird without changing it?",
    problemAr:
      "أغلب الحلول في السوق تعتمد على تقييد الحيوان أو تدريبه أو إجباره على التكيّف مع نمط الحياة البشرية. نادرًا ما يُطرح السؤال بالعكس: كيف نُغيّر البيئة لتخدم الحيوان دون أن نُغيّره؟",
    description:
      "This initiative explores how to create home environments where birds can live freely — including automatic, gentle cleaning solutions that detect and clean bird droppings without disturbing the bird. We believe loving birds means accepting them as they are.",
    descriptionAr:
      "تستكشف هذه المبادرة كيفية إنشاء بيئات منزلية يمكن للطيور أن تعيش فيها بحرية — بما في ذلك حلول تنظيف تلقائية لطيفة تكتشف فضلات الطيور وتنظفها دون إزعاج الطائر. نؤمن أن محبة الطيور تعني قبولها كما هي.",
    goals: [
      "Research existing smart cleaning solutions and their limitations",
      "Explore sensor and computer vision technologies for detection",
      "Design quiet, bird-friendly automatic cleaning concepts",
      "Open community discussion on ethical coexistence",
      "Share findings and designs openly",
    ],
    goalsAr: [
      "البحث في حلول التنظيف الذكية الموجودة وقيودها",
      "استكشاف تقنيات الحساسات والرؤية الحاسوبية للكشف",
      "تصميم مفاهيم تنظيف تلقائي هادئة وصديقة للطيور",
      "فتح نقاش مجتمعي حول التعايش الأخلاقي",
      "مشاركة النتائج والتصاميم بشكل مفتوح",
    ],
    faq: [
      {
        question: "Is there currently a device that monitors floors and cleans automatically when soiled?",
        answer: "No. There is no integrated home product yet that monitors the floor, detects bird droppings as soon as they occur, and then cleans them automatically in a quiet, non-disturbing way for the animal.",
      },
      {
        question: "But aren't there smart cleaning robots?",
        answer: "Yes, smart cleaning robots exist, but they usually work on a schedule, clean after passing over the area, don't understand bird droppings specifically, don't wait for the animal to move away, and may cause mess if they pass over droppings. They are not designed for coexistence with a free animal inside the home.",
      },
      {
        question: "Why hasn't such a solution been manufactured yet?",
        answer: "Because most market solutions rely on restricting the animal, training it, or forcing it to adapt to human lifestyles. The question is rarely asked the other way: How can we change the environment to serve the animal without changing it?",
      },
      {
        question: "Is the solution Wihngo proposes technically possible?",
        answer: "Yes, largely. Most technologies already exist: sensors, computer vision, spot-cleaning robots. What's missing is combining them into one system and adding ethical logic that respects the animal.",
      },
      {
        question: "Does Wihngo aim to sell a product?",
        answer: "Not at this stage. This is an open initiative aimed at research, thinking, experimentation, and opening a new discussion about coexistence with birds.",
      },
      {
        question: "Why does Wihngo care about this type of initiative?",
        answer: "Because we believe that birds' lives are short, every unnecessary burden we place on them matters, and loving birds means accepting them as they are, not modifying them.",
      },
    ],
    faqAr: [
      {
        question: "هل يوجد حاليًا جهاز في الأسواق يراقب الأرضيات وينظف تلقائيًا عند اتساخها؟",
        answer: "لا. لا يوجد حتى الآن منتج منزلي متكامل يقوم بمراقبة الأرضية، واكتشاف فضلات الطيور فور حدوثها، ثم تنظيفها تلقائيًا بطريقة هادئة وغير مزعجة للحيوان.",
      },
      {
        question: "لكن أليست هناك روبوتات تنظيف ذكية؟",
        answer: "نعم، توجد روبوتات تنظيف ذكية، لكنها تعمل غالبًا وفق جدول، أو تنظف بعد المرور على المكان، ولا تفهم فضلات الطيور تحديدًا، ولا تنتظر حتى يبتعد الحيوان، وقد تُسبب فوضى إذا مرت فوق الفضلات. أي أنها ليست مصممة للتعايش مع حيوان حر داخل المنزل.",
      },
      {
        question: "لماذا لم يتم تصنيع حل كهذا حتى الآن؟",
        answer: "لأن أغلب الحلول في السوق تعتمد على تقييد الحيوان أو تدريبه أو إجباره على التكيّف مع نمط الحياة البشرية. نادرًا ما يُطرح السؤال بالعكس: كيف نُغيّر البيئة لتخدم الحيوان دون أن نُغيّره؟",
      },
      {
        question: "هل الحل الذي تقترحه Wihngo ممكن تقنيًا؟",
        answer: "نعم، بنسبة كبيرة. معظم التقنيات موجودة بالفعل: حساسات، رؤية حاسوبية، روبوتات تنظيف موضعية. لكن ما ينقص هو جمعها في نظام واحد وإضافة منطق أخلاقي يحترم الحيوان.",
      },
      {
        question: "هل تهدف Wihngo لبيع منتج؟",
        answer: "لا في هذه المرحلة. هذه مبادرة مفتوحة هدفها البحث والتفكير والتجربة وفتح نقاش جديد حول التعايش مع الطيور.",
      },
      {
        question: "لماذا تهتم Wihngo بهذا النوع من المبادرات؟",
        answer: "لأننا نؤمن أن حياة الطيور قصيرة، وكل عبء غير ضروري نضعه عليها مهم، ومحبة الطيور تعني قبولها كما هي، لا تعديلها.",
      },
    ],
    conclusion: "We're not looking for a way to make birds 'suitable for the home' — we're looking for a home that's suitable for birds.",
    conclusionAr: "نحن لا نبحث عن طريقة لجعل الطيور 'مناسبة للبيت' بل نبحث عن بيت يكون مناسبًا للطيور.",
  },
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
