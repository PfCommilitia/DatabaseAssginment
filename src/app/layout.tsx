import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";
import SessionProviderWrapper from "@/app/dependencies/providers/sessionProviderWrapper";
import ReduxProviderWrapper from "@/app/dependencies/providers/reduxProviderWrapper";

export const metadata: Metadata = {
  title: "社团活动管理系统",
  description: "没有介绍。"
};

export default function RootLayout({ children }:
                                   Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang = "zh-CN">
    <body>
    <AppRouterCacheProvider
      options = { { key: "css" } }
    >
      <SessionProviderWrapper>
        <ReduxProviderWrapper>
          { children }
        </ReduxProviderWrapper>
      </SessionProviderWrapper>
    </AppRouterCacheProvider>
    </body>
    </html>
  );
}
