import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "مشاور همراه - پارسا و ملیکا",
  description: "وب‌اپلیکیشن مشاور هوشمند رابطه مخصوص پارسا و ملیکا - فضایی امن برای گفتگو و تفاهم",
  keywords: "مشاور رابطه, هوش مصنوعی, چت‌بات, مشاوره",
  authors: [{ name: "Moshaver App" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
