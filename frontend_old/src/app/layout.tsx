import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeoSurePath | Advanced GPS Intelligence",
  description: "Next-generation fleet tracking and security platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased selection:bg-primary/30`}>
        {children}
        <ToastContainer 
          position="bottom-right"
          theme="dark"
          toastStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
        />
      </body>
    </html>
  );
}
