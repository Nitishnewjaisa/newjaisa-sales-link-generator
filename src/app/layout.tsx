import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NewJaisa Sales Link Generator",
  description:
    "Internal tool for the NewJaisa Sales Team to generate UTM tracking links for newjaisa.com pages.",
  // Internal tool: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
