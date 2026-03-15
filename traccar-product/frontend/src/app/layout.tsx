import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      <body className="antialiased selection:bg-primary/30 font-sans">
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
