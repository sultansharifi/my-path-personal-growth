import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مسیر من | دفتر شخصی رشد",
  description: "فضای خصوصی برای شناخت اشتباهات، دیدن الگوها و ساختن انتخاب‌های بهتر",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
