import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileWarning from "./components/MobileWarning";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Бульк! - Цифровой мониторинг здоровья рыбы",
  description: "Полноценный SaaS для цифрового мониторинга на аквафермах.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
        <MobileWarning />
      </body>
    </html>
  );
}
