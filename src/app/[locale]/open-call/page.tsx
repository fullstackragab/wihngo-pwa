"use client";

import { useRouter, useParams } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Cpu,
  Wrench,
  Code,
  Palette,
  FlaskConical,
  Heart,
  Feather,
  CheckCircle,
  XCircle,
  Mail,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

export default function OpenCallPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === "ar";

  const currentInitiatives = [
    {
      icon: Wrench,
      title: isArabic ? "Care Wand" : "Care Wand",
      description: isArabic
        ? "جهاز محمول للتنظيف الفوري — شفط الفضلات، تغليفها بالمناديل، تنظيف موضعي عميق، وتعقيم لطيف."
        : "Handheld device for instant cleaning — suction, tissue wrapping, deep spot cleaning, and gentle disinfection.",
    },
    {
      icon: Feather,
      title: isArabic ? "Surface Harmonizer" : "Surface Harmonizer",
      description: isArabic
        ? "جهاز اختياري لتوحيد المظهر بعد التنظيف — هواء دافئ واهتزاز لطيف، بدون ماء أو كيماويات."
        : "Optional device for visual harmony after cleaning — warm air and gentle vibration, no water or chemicals.",
    },
  ];

  const lookingFor = [
    {
      icon: Cpu,
      title: isArabic ? "مهندسو روبوتات" : "Robotics Engineers",
      titleEn: "Robotics Engineers",
    },
    {
      icon: Wrench,
      title: isArabic
        ? "مهندسو ميكاترونكس"
        : "Mechanical / Mechatronics Engineers",
      titleEn: "Mechanical / Mechatronics Engineers",
    },
    {
      icon: Code,
      title: isArabic
        ? "مطورو أنظمة مدمجة"
        : "Embedded Systems Developers",
      titleEn: "Embedded Systems Developers",
    },
    {
      icon: Palette,
      title: isArabic
        ? "مصممو منتجات صناعية"
        : "Product & Industrial Designers",
      titleEn: "Product & Industrial Designers",
    },
    {
      icon: FlaskConical,
      title: isArabic
        ? "باحثون في التعايش البشري-الحيواني"
        : "Human–Animal Coexistence Researchers",
      titleEn: "Human–Animal Coexistence Researchers",
    },
  ];

  const whatThisIs = [
    {
      positive: true,
      text: isArabic ? "مبادرة مفتوحة" : "An open initiative",
    },
    {
      positive: true,
      text: isArabic
        ? "مساحة للاستكشاف والنماذج الأولية"
        : "A space for exploration and prototyping",
    },
    {
      positive: true,
      text: isArabic ? "رؤية طويلة المدى" : "A long-term vision",
    },
    {
      positive: false,
      text: isArabic ? "ليس عرض منتج" : "Not a product pitch",
    },
    {
      positive: false,
      text: isArabic ? "ليس إطلاق تجاري" : "Not a commercial launch",
    },
    {
      positive: false,
      text: isArabic ? "ليس شركة ناشئة (حتى الآن)" : "Not a startup (yet)",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar
        title={isArabic ? "دعوة مفتوحة" : "Open Call"}
        onBack={() => router.back()}
      />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-medium text-foreground mb-3">
            {isArabic
              ? "بناء أدوات تتكيف مع الطيور"
              : "Building Tools That Adapt to Birds"}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "نبحث عن مهندسين ومصممين يشاركوننا الرؤية"
              : "Looking for engineers and designers who share our vision"}
          </p>
        </motion.div>

        {/* Philosophy Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground leading-relaxed text-center">
              {isArabic
                ? "في Wihngo، نؤمن أن محبة الطيور تعني احترام طبيعتها — لا إعادة تشكيلها لراحتنا."
                : "At Wihngo, we believe that loving birds means respecting their nature — not reshaping it for our comfort."}
            </p>
          </Card>
        </motion.div>

        {/* What We're Building */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">
            {isArabic
              ? "أدوات مسؤولية إنسانية"
              : "Human Responsibility Tools"}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {isArabic
              ? "حلول تقنية تتحمل العبء عن الإنسان، حتى تعيش الطيور بحرية وطبيعية."
              : "Technological solutions that carry the burden for humans, so birds can live freely and naturally."}
          </p>
        </motion.div>

        {/* Two-Step System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">
            {isArabic ? "نظام التعايش ثنائي الخطوات" : "Two-Step Coexistence System"}
          </h2>
          <div className="space-y-3">
            {currentInitiatives.map((initiative, index) => (
              <Card key={index} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <initiative.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground font-medium mb-2">
                      {initiative.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {initiative.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-4 bg-accent/30 border-accent text-center">
            <p className="text-sm text-foreground/80">
              {isArabic
                ? "الرؤية بسيطة: يجب أن يستطيع الدجاج النوم في أي مكان — والتكنولوجيا تتحمل المسؤولية بهدوء."
                : "The vision is simple: Chickens should be able to sleep anywhere — and technology should quietly take responsibility."}
            </p>
          </Card>
        </motion.div>

        {/* Who We're Looking For */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">
            {isArabic ? "من نبحث عنهم" : "Who We're Looking For"}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {isArabic
              ? "نرحب بمن يهتمون بالتصميم الأخلاقي أكثر من الحلول السريعة"
              : "We welcome people who care more about ethical design than quick fixes"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {lookingFor.map((person, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Card className="p-4 text-center">
                  <person.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-foreground font-medium">
                    {person.title}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground/80 text-center">
              {isArabic
                ? "لا تحتاج حلاً جاهزاً. الفضول واحترام الحياة والهندسة المدروسة أهم."
                : "You don't need a finished solution. Curiosity, respect for life, and thoughtful engineering matter more."}
            </p>
          </Card>
        </motion.div>

        {/* What This Is */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">
            {isArabic ? "ما هذا (وما ليس)" : "What This Is (and Is Not)"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {whatThisIs.map((item, index) => (
              <Card
                key={index}
                className={`p-3 ${
                  item.positive
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.positive ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <p
                    className={`text-sm ${
                      item.positive ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Why This Matters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <h3 className="text-foreground font-medium mb-3 text-center">
              {isArabic ? "لماذا هذا مهم" : "Why This Matters"}
            </h3>
            <p className="text-foreground/80 leading-relaxed text-center">
              {isArabic
                ? "حياة الطيور قصيرة. كل عبء غير ضروري نضعه عليها مهم. إذا كانت التكنولوجيا تستطيع تقليل هذا العبء — فيجب أن تفعل."
                : "Birds have short lives. Every unnecessary burden we place on them matters. If technology can reduce that burden — then it should."}
            </p>
          </Card>
        </motion.div>

        {/* Join the Conversation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">
            {isArabic ? "انضم إلى الحوار" : "Join the Conversation"}
          </h2>
          <Card className="p-5">
            <p className="text-muted-foreground text-center mb-4">
              {isArabic
                ? "إذا كانت هذه الطريقة في التفكير تتردد صداها معك، نود أن نسمع منك."
                : "If this way of thinking resonates with you, we'd love to hear from you."}
            </p>
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="flex items-center gap-3 justify-center">
                <Mail className="w-4 h-4 text-primary" />
                <span>{isArabic ? "تواصل معنا" : "Reach out to Wihngo"}</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span>
                  {isArabic
                    ? "شارك فكرة أو رسمة أو سؤال"
                    : "Share an idea, a sketch, or a question"}
                </span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Heart className="w-4 h-4 text-primary" />
                <span>
                  {isArabic
                    ? "أو ببساطة أخبرنا لماذا تهتم"
                    : "Or simply tell us why you care"}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Closing Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20 text-center">
            <p className="text-foreground leading-relaxed font-medium">
              {isArabic
                ? "Wihngo ليست مجرد منصة. إنها محاولة للعيش مع الطيور — دون إجبارها على التغيير."
                : "Wihngo is not just a platform. It is an attempt to live with birds — without forcing them to change."}
            </p>
          </Card>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3"
        >
          <Link href="/manifesto">
            <Button className="w-full rounded-full">
              <Feather className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {isArabic ? "اقرأ البيان" : "Read Our Manifesto"}
              <ArrowRight className="w-4 h-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
            </Button>
          </Link>
          <Link href="/initiatives">
            <Button variant="outline" className="w-full rounded-full">
              <Lightbulb className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {isArabic ? "استكشف المبادرات" : "Explore All Initiatives"}
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
