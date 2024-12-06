"use client";

import {
  Box,
  Typography
} from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import { useInitSession } from "@/app/dependencies/lib/initSession";
import FootBar from "@/app/dependencies/sharedComponents/footBar";

export default function Home() {
  useInitSession();

  return (
    <Box
      sx = { {
        alignItems: "center",
        justifyItems: "center",
        width: "100vw",
        height: "100vh"
      } }
    >
      <TopBar></TopBar>
      <Box
        sx = { {
          display: "grid",
          alignItems: "center",
          justifyItems: "center",
          bgcolor: "primary.main",
          width: "100%",
          height: "80%",
        } }
      >
        <Box
          component = "main"
          sx = { {
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            width: "100%"
          } }
        >
          <Typography
            variant = "h1"
            sx = { {
              color: "primary.contrastText",
              paddingY: "0.1em",
              lineHeight: "1.5em"
            } }
          >
            社团活动信息管理系统
          </Typography>
        </Box>
      </Box>
      <FootBar></FootBar>
    </Box>
  );
}