"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

export default function WhyBirdsMatterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === "ar";

  const sections = [
    {
      title: isArabic ? "الصراع الصامت" : "The Silent Struggle",
      content: isArabic
        ? "من يربي الطيور في المنزل يعرف مدى ضعفها. مصدرها الوحيد هو الطعام الذي نقدمه؛ لا تستطيع كسب عيشها أو إيجاد طعامها بنفسها. عندما تضع الطعام لها، تحاول الطيور التمسك به كأنه كنز."
        : "Those who raise birds at home know how vulnerable they are. Their only resource is the food we provide; they cannot earn a living or find food on their own. When you put out food for them, birds try to hold onto it as if it were a treasure.",
    },
    {
      title: isArabic ? "إيماءات صغيرة، قلوب كبيرة" : "Small Gestures, Big Hearts",
      content: isArabic
        ? "رأيت مرة دجاجة مسمنة، بعد الأكل، تجلس بجانب الطبق، تضمه بجناحها كأنها تخاف أن يأخذه أحد منها. بعض الطيور تجلس فوق طعامها، وبعضها تدوس عليه بأقدامها. الطيور ليس لديها أيدٍ مثلنا؛ تنقر بمنقارها لتأكل أو تصيح لتطلب شيئاً."
        : "I once saw a fattened hen, after eating, sit next to the dish, clutching it with her wing as if afraid someone would take it from her. Some birds sit on top of their food, and some even tread on it with their feet. Birds do not have hands like we do; they simply peck with their beaks to eat or chirp to ask for something.",
    },
    {
      title: isArabic ? "تحدي الرعاية" : "The Challenge of Care",
      content: isArabic
        ? "تربية دجاج التسمين علمتني احتياجاتها. هي من أضعف المخلوقات؛ تحب الماء النظيف والنظافة. للأسف، غالباً ما يُهمل أمرها، خاصة فيما يتعلق بالنظافة. تُحفظ في أماكن قذرة، وبينما تعاني، لا تستطيع فعل أي شيء حيال ذلك."
        : "Raising broiler chickens taught me about their needs. They are among the weakest creatures; they love clean water and cleanliness. Unfortunately, they are often neglected, especially regarding hygiene. They are kept in dirty places, and while they suffer, they cannot do anything about it.",
    },
    {
      title: isArabic ? "الكرامة في الأشياء البسيطة" : "Dignity in Simple Things",
      content: isArabic
        ? "عندما تحتاج الدجاجة لقضاء حاجتها، يجب أن تفعل ذلك في مكانها، وكل ما تستطيع فعله هو الانتقال لمكان آخر. إن لم يكن هناك مساحة، تُجبر على الجلوس على الفضلات وتتسخ، وهذا تعذيب لها. هذه المخلوقات تستحق أفضل من ذلك."
        : "When a hen needs to relieve herself, she must do it right there, and all she can do is move to another spot. If there is no space, she is forced to sit on the waste and get dirty, which is torture for her. These creatures deserve better.",
    },
    {
      title: isArabic ? "رسالتنا" : "Our Mission",
      content: isArabic
        ? "تهدف هذه المبادرة إلى تشجيع الناس على رعاية الطيور وتغذيتها، بما في ذلك تنظيفها وإطعامها طعامها المفضل. نريد أن تبقى الطيور بصحة جيدة وتشعر بالحب."
        : "This initiative aims to encourage people to care for and nurture birds, including cleaning them and feeding them their favorite food. We want birds to stay healthy and feel loved.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar
        title={isArabic ? "لماذا الطيور مهمة" : "Why Birds Matter"}
        onBack={() => router.back()}
      />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            {isArabic
              ? "هي تعتمد علينا أكثر مما ندرك"
              : "They depend on us more than we realize"}
          </p>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="p-5">
                <h3 className="text-foreground font-medium mb-2">
                  {section.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-4"
        >
          <Card className="p-6 bg-primary/5 border-primary/20 text-center">
            <h3 className="text-foreground font-medium mb-4">
              {isArabic ? "ادعم الطيور مع وينغو" : "Support Birds with Wihngo"}
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
