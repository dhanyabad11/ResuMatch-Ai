import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { APP_CONFIG } from "@/lib/config";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: `${APP_CONFIG.name} - Resume Analyzer`,
    description: APP_CONFIG.description,
    icons: {
        icon: [
            { url: "/favicon.png", sizes: "32x32" },
            { url: "/icon-192.png", sizes: "192x192" },
        ],
        apple: "/apple-icon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} antialiased`}>{children}</body>
        </html>
    );
}
