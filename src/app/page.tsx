"use client";

import {
  Box,
  Button,
  Typography,
  Tooltip
} from "@mui/material";
import { getSession } from "next-auth/react";
import LoginDialog from "@/app/dependencies/clientComponents/loginDialog";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { setSession } from "@/app/dependencies/redux/stateSlices/session";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LoginButton() {
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

function ConsoleButton() {
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


function TopLeftButton() {
  const session = useSelector((state: RootState) => state.session.session);

  return (
    <Box
      sx = { {
        display: "flex",
        minWidth: "100%",
        minHeight: "6vh",
        maxHeight: "6vh"
      } }
    >
      { session ? <ConsoleButton/> :
        <LoginButton/> }
    </Box>
  );
}

export default function Home() {
  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchSession() {
      const currentSession = await getSession();
      dispatch(setSession(currentSession));
    }

    fetchSession();
  }, [ dispatch ]);

  return (
    <Box
      sx = { {
        alignItems: "center",
        justifyItems: "center",
        minWidth: "100%",
        minHeight: "100vh"
      } }
    >
      <Box
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
        <TopLeftButton/>
      </Box>
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