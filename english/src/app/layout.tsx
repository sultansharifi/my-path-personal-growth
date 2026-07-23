import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Path | Personal Growth Journal",
  description: "A private place to notice patterns, reflect on mistakes, and make better choices",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
