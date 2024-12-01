"use client";

import { Box } from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";

export function NotLoggedIn(): JSX.Element {
  return (
          <Box
                  sx = { {
                    alignItems: "center",
                    justifyItems: "center",
                    minWidth: "100%",
                    minHeight: "100vh"
                  } }
          >
            <TopBar></TopBar>
          </Box>
  );
}