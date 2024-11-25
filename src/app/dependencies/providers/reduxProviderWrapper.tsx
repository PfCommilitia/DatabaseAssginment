"use client";

import { Provider as ReduxProvider } from "react-redux";
import store from "@/app/dependencies/redux/store";
import { ReactNode } from "react";

export default function ReduxProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store = { store }>
      { children }
    </ReduxProvider>
  );
}