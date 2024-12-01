"use client";

import { Box, Button, Tooltip, Typography } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { useState } from "react";
import LoginDialog from "@/app/dependencies/sharedComponents/loginDialog";
import { setSession } from "@/app/dependencies/redux/stateSlices/session";
import { getSession, signOut } from "next-auth/react";

function ConsoleButtonGroup(): JSX.Element {
  const dispatch = useDispatch();

  async function handleLogout() {
    await signOut({ redirect: false });
    const currentSession = await getSession();
    if (!currentSession) {
      dispatch(setSession(null));
    } else {
      alert("登出失败，请重试。");
    }
  }

  return (
          <Box
                  sx = { {
                    display: "flex",
                    marginLeft: "auto"
                  } }
          >
            <Tooltip
                    title = "登出"
            >
              <Button
                      variant = "text"
                      color = "info"
              >
                <Typography
                        variant = "h4"
                        sx = { {
                          color: "primary.contrastText",
                          lineHeight: "1.5em",
                          paddingY: "0.1em"
                        } }
                        onClick = { handleLogout }
                >
                  󰍃
                </Typography>
              </Button>
            </Tooltip>
            <Tooltip
                    title = "用户"
            >
              <Button
                      variant = "text"
                      color = "info"
                      href = "/userinfo"
              >
                <Typography
                        variant = "h4"
                        sx = { {
                          color: "primary.contrastText",
                          lineHeight: "1.5em",
                          paddingY: "0.1em"
                        } }
                >
                  󰀉
                </Typography>
              </Button>
            </Tooltip>
            <Tooltip
                    title = "控制台"
            >
              <Button
                      variant = "contained"
                      color = "info"
                      href = "/console"
              >
                <Typography
                        sx = { {
                          color: "primary.contrastText",
                          lineHeight: "1.5em",
                          paddingY: "0.1em"
                        } }
                >
                  󰆍 控制台
                </Typography>
              </Button>
            </Tooltip>
          </Box>
  );
}

function LoginButtonGroup(): JSX.Element {
  const [ dialogOpen, setDialogOpen ] = useState(false);

  return (
          <>
            <Tooltip
                    title = "用户登录"
            >
              <Button
                      variant = "contained"
                      color = "info"
                      sx = { {
                        marginLeft: "auto"
                      } }
                      onClick = { () => setDialogOpen(true) }
              >
                <Typography
                        sx = { {
                          color: "primary.contrastText"
                        } }
                >
                  󰍂 用户登录
                </Typography>
              </Button>
            </Tooltip>
            <LoginDialog
                    open = { dialogOpen }
                    handleCloseAction = { () => {
                      setDialogOpen(false);
                    } }
            />
          </>
  );
}

export default function TopBar(): JSX.Element {
  const session = useSelector((state: RootState) => state.session.session);
  return (<Box
          component = "header"
          sx = { {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "primary.dark",
            minWidth: "100%",
            minHeight: "10vh",
            maxHeight: "10vh"
          } }
  >
    <Box
            sx = { {
              display: "flex",
              minWidth: "100%",
              minHeight: "6vh",
              maxHeight: "6vh"
            } }
    >
      { session ? <ConsoleButtonGroup/> : <LoginButtonGroup/> }
    </Box>
  </Box>);
}