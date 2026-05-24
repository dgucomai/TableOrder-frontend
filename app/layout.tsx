import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from './providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "CAISINO | %s", // 하위 페이지 제목이 %s 자리에 들어갑니다.
    default: "CAISINO", // 하위 페이지에 제목이 없을 때 사용할 기본값
  },
  description: "동국대학교 컴퓨터AI학부 주점 CAISINO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 브라우저가 모든 http 요청을 https로 자동 변환하도록 강제 */}
        <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}