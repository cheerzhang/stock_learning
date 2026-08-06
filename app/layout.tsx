import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "仓鉴 · 私人投资分析",
  description: "记录每日投入与持仓市值，看清每项资产的收益贡献。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
