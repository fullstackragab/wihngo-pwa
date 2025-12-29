import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { isRtlLocale, type Locale } from "@/i18n/config";
import { Providers } from "../providers";
import { Toaster } from "sonner";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wihngo - Where Hearts & Wings Gather",
  description:
    "Support birds and their caretakers, and share heartwarming stories",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wihngo",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Wihngo",
    title: "Wihngo - Where Hearts & Wings Gather",
    description:
      "Support birds and their caretakers, and share heartwarming stories",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wihngo",
    description:
      "Support birds and their caretakers, and share heartwarming stories",
  },
};

export const viewport: Viewport = {
  themeColor: "#7a9b76",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for this locale
  const messages = await getMessages();

  // Check if RTL
  const isRtl = isRtlLocale(locale as Locale);
  const dir = isRtl ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/apple-splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
      </head>
      <body
        className={`${inter.variable} ${notoArabic.variable} ${
          isRtl ? "font-arabic" : "font-sans"
        } antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
