"use client";

import { useRouter, useParams } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Heart,
  Feather,
  Shield,
  Lightbulb,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

export default function ManifestoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === "ar";

  const principles = [
    {
      icon: Heart,
      title: isArabic ? "الحب أولاً" : "Love First",
      content: isArabic
        ? "كل ما نفعله مدفوع بحب حقيقي للطيور. ليس كديكور، ليس كهواية — بل ككائنات تستحق الاحترام والرعاية."
        : "Everything we do is driven by genuine love for birds. Not as decoration, not as hobby — but as beings worthy of respect and care.",
    },
    {
      icon: Feather,
      title: isArabic ? "الحرية غير قابلة للتفاوض" : "Freedom is Non-Negotiable",
      content: isArabic
        ? "الطيور حرة 100%. لا تدريب قسري، لا حفاضات، لا تقييد للحركة. نحن نتكيف معهم — لا العكس."
        : "Birds are 100% free. No forced training, no diapers, no movement restrictions. We adapt to them — not the other way around.",
    },
    {
      icon: Shield,
      title: isArabic ? "العبء على الإنسان" : "The Burden is on Humans",
      content: isArabic
        ? "إذا كان هناك عبء، فالإنسان يتحمله بالكامل. التكنولوجيا يجب أن تخفف هذا العبء — لا أن تنقله للطائر."
        : "If there is a burden, humans carry it entirely. Technology should ease this burden — not transfer it to the bird.",
    },
    {
      icon: Lightbulb,
      title: isArabic ? "الابتكار الأخلاقي" : "Ethical Innovation",
      content: isArabic
        ? "نستكشف حلولاً تقنية تخدم الحيوان دون تغييره. أدوات مسؤولية إنسانية، لا أدوات سيطرة."
        : "We explore technological solutions that serve animals without changing them. Human responsibility tools, not control tools.",
    },
  ];

  const commitments = [
    {
      title: isArabic ? "نحترم طبيعتهم" : "We Respect Their Nature",
      content: isArabic
        ? "لن نطلب من طائر أن يتغير ليناسب بيتنا. بل نغير بيتنا ليناسب الطائر."
        : "We will never ask a bird to change to fit our home. Instead, we change our home to fit the bird.",
    },
    {
      title: isArabic ? "نتحمل المسؤولية" : "We Take Responsibility",
      content: isArabic
        ? "التنظيف، التكيف، الصبر — كل هذا على عاتقنا. الطائر لا يدين لنا بشيء."
        : "Cleaning, adapting, patience — all of this is on us. The bird owes us nothing.",
    },
    {
      title: isArabic ? "نبني أدوات لا قيود" : "We Build Tools, Not Constraints",
      content: isArabic
        ? "كل تقنية نستكشفها مصممة لمساعدة الإنسان — لا لتقييد الحيوان."
        : "Every technology we explore is designed to help humans — not to constrain animals.",
    },
    {
      title: isArabic ? "نشارك بشفافية" : "We Share Transparently",
      content: isArabic
        ? "أفكارنا وتصاميمنا ونتائجنا مفتوحة للجميع. المعرفة للمشاركة."
        : "Our ideas, designs, and findings are open to everyone. Knowledge is for sharing.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar
        title={isArabic ? "بيان Wihngo" : "Wihngo Manifesto"}
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
            <Feather className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-medium text-foreground mb-3">
            {isArabic
              ? "محبة الطيور تعني قبولها كما هي"
              : "Loving Birds Means Accepting Them As They Are"}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "ليس محاولة تغييرها لتناسب راحتنا"
              : "Not trying to change them to fit our comfort"}
          </p>
        </motion.div>

        {/* Core Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <p className="text-foreground leading-relaxed text-center">
              {isArabic
                ? "Wihngo ليست مجرد منصة. إنها محاولة للعيش مع الطيور — دون إجبارها على التغيير."
                : "Wihngo is not just a platform. It is an attempt to live with birds — without forcing them to change."}
            </p>
          </Card>
        </motion.div>

        {/* Our Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">
            {isArabic ? "مبادئنا الأساسية" : "Our Core Principles"}
          </h2>
          <div className="grid gap-4">
            {principles.map((principle, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <principle.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-foreground font-medium mb-2">
                        {principle.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {principle.content}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
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
              {isArabic ? "لماذا هذا مهم؟" : "Why Does This Matter?"}
            </h3>
            <p className="text-foreground/80 leading-relaxed text-center">
              {isArabic
                ? "حياة الطيور قصيرة. كل عبء غير ضروري نضعه عليها مهم. إذا كانت التكنولوجيا تستطيع تقليل هذا العبء — فيجب أن تفعل."
                : "Birds have short lives. Every unnecessary burden we place on them matters. If technology can reduce that burden — then it should."}
            </p>
          </Card>
        </motion.div>

        {/* Our Commitments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">
            {isArabic ? "التزاماتنا" : "Our Commitments"}
          </h2>
          <div className="space-y-3">
            {commitments.map((commitment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Card className="p-4">
                  <h4 className="text-foreground font-medium mb-1 text-sm">
                    {commitment.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {commitment.content}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* The Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20 text-center">
            <h3 className="text-foreground font-medium mb-3">
              {isArabic ? "الرؤية النهائية" : "The Ultimate Vision"}
            </h3>
            <p className="text-foreground/80 leading-relaxed mb-4">
              {isArabic
                ? "طائر ينام حيث يشاء. إنسان بلا قلق. بيت يتّسع للحياة كما هي."
                : "A bird that sleeps wherever it wants. A human without worry. A home that makes room for life as it is."}
            </p>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="space-y-3"
        >
          <Link href="/open-call">
            <Button className="w-full rounded-full">
              <Users className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {isArabic ? "انضم إلى المبادرة" : "Join the Initiative"}
              <ArrowRight className="w-4 h-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
            </Button>
          </Link>
          <Link href="/initiatives">
            <Button variant="outline" className="w-full rounded-full">
              <Lightbulb className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {isArabic ? "استكشف المبادرات" : "Explore Initiatives"}
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
