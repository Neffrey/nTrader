import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { convexUrlForHost } from "@/lib/convex-deployment";
import { isLocalHostRequest } from "@/lib/local-request";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nTrader",
  description: "Arbitrage Trade Tools for PoE",
  icons: {
    icon: "/convex.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host");
  const localHost = await isLocalHostRequest();
  const convexUrl = convexUrlForHost(host);

  return (
    <ConvexAuthNextjsServerProvider storageNamespace={convexUrl}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider convexUrl={convexUrl}>
            <div className="flex min-h-screen flex-col">
              <Header localHost={localHost} />
              <div className="flex flex-1 flex-col">{children}</div>
              <Footer />
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
