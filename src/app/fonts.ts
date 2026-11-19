import { Bodoni_Moda, Inter } from "next/font/google";

/** Serif for everything the user reads, especially French text (DS-6). */
export const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

/** Sans-serif for small labels and short German helper text only (DS-6). */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});
