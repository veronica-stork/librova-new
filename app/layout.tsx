import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://librova.com'),
  title: "Librova",
  description: "Library event finder",
  icons: {
    icon: "/favicon.png", 
  },

  openGraph: {
    title: 'Librova',
    description: 'Find library events near you',
    url: 'https://librova.com', 
    siteName: 'Librova',
    type: 'website',            
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image.png', // Or whatever your file is named in /public
        width: 1200,
        height: 630,
        alt: 'Librova Event Finder',
      },
    ],
  },
};
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        
        {/* 1. The custom external script Plausible generated for you */}
        <Script 
          id="plausible-external"
          src="https://plausible.io/js/pa-sg4BID33_L_D4oA_Whr8M.js" 
          strategy="afterInteractive"
        />

        {/* 2. The inline initialization code they provided */}
        <Script id="plausible-init" strategy="afterInteractive">
          {`
            window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
            plausible.init()
          `}
        </Script>
      </body>
    </html>
  );
}
