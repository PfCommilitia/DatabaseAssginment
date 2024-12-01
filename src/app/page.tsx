"use client";

import {
  Box,
  Typography
} from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import { useInitSession } from "@/app/dependencies/lib/initSession";

export default function Home() {
  useInitSession();

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
      <Box
        sx = { {
          display: "grid",
          alignItems: "center",
          justifyItems: "center",
          bgcolor: "primary.main",
          minWidth: "100%",
          minHeight: "80vh"
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
      <Box
        component = "footer"
        sx = { {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.dark",
          minWidth: "100%",
          minHeight: "10vh",
          maxHeight: "10vh"
        } }
      >
        <Typography
          sx = { {
            color: "primary.contrastText",
            paddingY: "0.1em",
            textAlign: "center",
            lineHeight: "1.5em"
          } }
        >
          2022202696程敬轩，2022202677朱天哲，2022202590姚梁浩，2022202701邓托宇  2024
        </Typography>
      </Box>
    </Box>
  );
}