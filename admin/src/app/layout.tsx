import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AdminAuthWrapper from "./AdminAuthWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel | E-Commerce",
  description: "Modern E-Commerce Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminAuthWrapper>
          {children}
        </AdminAuthWrapper>
      </body>
    </html>
  );
}
