import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/components/VaultProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Obsidian Web PARA",
  description: "Synchronize and manage your Obsidian vault via GitHub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className={inter.className}>
        <VaultProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </VaultProvider>
      </body>
    </html>
  );
}
