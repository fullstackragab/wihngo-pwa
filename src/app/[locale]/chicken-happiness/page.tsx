"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Check, X } from "lucide-react";
import { motion } from "motion/react";

export default function ChickenHappinessPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === "ar";

  const whatWeMean = [
    isArabic ? "مساحة للحركة" : "Space to move",
    isArabic ? "ضوء الشمس" : "Sunlight",
    isArabic ? "القدرة على الحفر والتفاعل" : "The ability to scratch and interact",
    isArabic ? "العيش بدون خوف دائم" : "Living without constant fear",
    isArabic
      ? "معاملة هادئة تحترم كينونتها ككائن حي"
      : "Calm treatment that respects their being as a living creature",
  ];

  const whatWeDontClaim = [
    isArabic ? "لا ندّعي أن الموت يجلب السعادة" : "We don't claim that death brings happiness",
    isArabic ? "لا ندّعي أن الذبح نعمة" : "We don't claim that slaughter is a blessing",
    isArabic ? "لا ندّعي امتلاك الحقيقة المطلقة" : "We don't claim to possess absolute truth",
  ];

  const chickenParagraphs = [
    isArabic
      ? "الدجاجة كائن ضعيف يعيش قريباً من الإنسان ويعتمد عليه في تفاصيل حياته اليومية."
      : "A chicken is a vulnerable creature that lives close to humans and depends on them for the details of its daily life.",
    isArabic
      ? "حياتها تتأثر بكيفية تعاملنا معها؛ تشعر، تهدأ، تعاني، وتعيش وفقاً لهذه المعاملة."
      : "Its life is affected by how we treat it; it feels, calms, suffers, and lives according to this treatment.",
    isArabic
      ? "تحتاج إلى رعاية واعية تحترم كينونتها ككائن حي."
      : "It needs conscious care that respects its being as a living creature.",
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar
        title={isArabic ? "سعادة الدجاج" : "Chicken Happiness"}
        onBack={() => router.back()}
      />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <h2 className="text-xl font-medium text-foreground mb-3">
            {isArabic ? "حق الدجاجة في السعادة" : "The Chicken's Right to Happiness"}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-2">
            {isArabic
              ? "نؤمن أن الدجاجة ليست مجرد منتج، بل كائن حي يشعر بالخوف والراحة والتوتر."
              : "We believe that a chicken is not just a product, but a living being that feels fear, comfort, and stress."}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "هدف هذه الصفحة هو تقليل معاناة الدجاج ومساعدتها على عيش حياة أقرب ما تكون للسعادة."
              : "The goal of this page is to reduce chicken suffering and help them live a life as close to happiness as possible."}
          </p>
        </motion.div>

        {/* What We Mean Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="text-foreground font-medium mb-2 text-center">
              {isArabic ? "ماذا نعني بسعادة الدجاج؟" : "What Do We Mean by Chicken Happiness?"}
            </h3>
            <p className="text-muted-foreground text-sm text-center mb-4">
              {isArabic
                ? "سعادة الدجاج لا تعني الكمال، بل تعني:"
                : "Chicken happiness doesn't mean perfection, it means:"}
            </p>
            <ul className="space-y-3">
              {whatWeMean.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* What We Don't Claim Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-4 text-center">
              {isArabic ? "ما لا ندّعيه" : "What We Don't Claim"}
            </h3>
            <ul className="space-y-3">
              {whatWeDontClaim.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* We Acknowledge Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-accent/30 border-accent text-center">
            <h3 className="text-foreground font-medium mb-3">
              {isArabic ? "نحن نعترف" : "We Acknowledge"}
            </h3>
            <p className="text-foreground/80 leading-relaxed">
              {isArabic
                ? "الدجاج يعاني عند المعاملة القاسية ويهدأ عند المعاملة اللطيفة"
                : "Chickens suffer when treated harshly and calm down when treated gently"}
            </p>
          </Card>
        </motion.div>

        {/* Chicken as Living Being Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-foreground font-medium mb-4 text-center">
              {isArabic ? "الدجاجة ككائن حي" : "The Chicken as a Living Being"}
            </h3>
            <div className="space-y-4">
              {chickenParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-muted-foreground leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Ethical Position Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 text-center">
            <h3 className="text-foreground font-medium mb-4">
              {isArabic ? "موقفنا الأخلاقي" : "Our Ethical Position"}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {isArabic
                ? "إذا اختار شخص استخدام الدجاج للطعام، فيجب أن يختار أيضاً:"
                : "If a person chooses to use chickens for food, they should also choose:"}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isArabic
                ? "حياة أفضل لها، وأقل قدر ممكن من الألم والخوف"
                : "A better life for them, and the least possible amount of pain and fear"}
            </p>
            <p className="text-foreground font-medium">
              {isArabic ? "الرحمة ليست ضعفاً، إنها وعي." : "Compassion is not weakness, it is awareness."}
            </p>
          </Card>
        </motion.div>

        {/* Why This Page Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-muted/50 text-center">
            <h3 className="text-foreground font-medium mb-3">
              {isArabic ? "لماذا هذه الصفحة؟" : "Why This Page?"}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isArabic
                ? "لأن تغيير مصير الدجاج لا يبدأ فقط من المزارع، بل من وعي الإنسان."
                : "Because changing the fate of chickens doesn't start only from farms, but from human awareness."}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {isArabic
                ? "لا نعد بعالم مثالي، لكننا نعمل نحو:"
                : "We don't promise a perfect world, but we work towards:"}
            </p>
            <p className="text-foreground font-medium">
              {isArabic
                ? "عالم أقل قسوة وحياة أكثر رحمة للدجاج"
                : "A less cruel world and a more merciful life for chickens"}
            </p>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-4"
        >
          <Card className="p-6 bg-primary/5 border-primary/20 text-center">
            <h3 className="text-foreground font-medium mb-4">
              {isArabic ? "ادعم رعاية الدجاج مع وينغو" : "Support Chicken Care with Wihngo"}
            </h3>
            <Link href="/birds">
              <Button size="lg" className="rounded-full gap-2">
                <Heart className="w-4 h-4" />
                {isArabic ? "استكشف الطيور" : "Explore Birds"}
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
