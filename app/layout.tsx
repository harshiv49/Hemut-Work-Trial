import type { Metadata } from "next";
import { Urbanist } from 'next/font/google';
import "./globals.css";
import "leaflet/dist/leaflet.css";

const urbanist = Urbanist({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-urbanist',
});

export const metadata: Metadata = {
  title: "Uniglobe - Freight TMS",
  description: "Transportation Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${urbanist.variable} font-sans antialiased h-full overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
