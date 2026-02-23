import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Collector",
  description: "AI-guided business process capture assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
