"use client";

import { Box, Typography } from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import { useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import FootBar from "@/app/dependencies/sharedComponents/footBar";

export function NotLoggedIn(): JSX.Element {
  const fetching = useSelector((state: RootState) => state.session.fetching);

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
                  { fetching ? "正在获取用户信息" : "用户未登录" }
                </Typography>
                <Typography
                        variant = "h4"
                        sx = { {
                          color: "primary.contrastText",
                          paddingY: "0.1em",
                          lineHeight: "1.5em"
                        } }
                >
                  { fetching ? "请等待获取用户信息；如果页面长时间没有反应，请尝试刷新" : "必须登录以使用此功能，请点击右上角的按钮登录" }
                </Typography>
              </Box>
              </Box>
            </Box>
            <FootBar></FootBar>
          </Box>
  );
}