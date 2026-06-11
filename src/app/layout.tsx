import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مشاور همراه - پارسا و ملیکا",
  description: "وب‌اپلیکیشن چت‌بات مشاور هوشمند رابطه مخصوص پارسا و ملیکا",
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
