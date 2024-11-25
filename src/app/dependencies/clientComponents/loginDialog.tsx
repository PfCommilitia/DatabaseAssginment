"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions, DialogContent,
  DialogTitle,
  TextField,
  Tooltip, Typography
} from "@mui/material";
import { getSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useDispatch } from "react-redux";
import { setSession } from "@/app/dependencies/redux/stateSlices/session";

export default function LoginDialog({ open, handleCloseAction }: {
  open: boolean,
  handleCloseAction: () => void,
}) {
  const [ username, setUsername ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ status, setStatus ] = useState<string | null>(null);
  const dispatch = useDispatch();

  async function handleLogin() {
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      });
      if (result?.ok) {
        const session = await getSession();
        dispatch(setSession(session));
        handleCloseAction();
      } else {
        setStatus("用户名或密码错误");
      }
    } catch (e) {
      setStatus("登录时发生错误\n" + e);
    }
  }

  return (
    <Dialog open = { open } onClose = { handleCloseAction }>
      <DialogTitle>用户登录</DialogTitle>
      {
        status &&
        <Typography
          sx = { {
            backgroundColor: "orange",
            color: "red",
            paddingLeft: "5%"
          } }
        >
           登录失败：{ status }
        </Typography>
      }
      <DialogContent>
        <TextField
          autoFocus
          margin = "dense"
          label = "用户名"
          type = "text"
          fullWidth
          variant = "standard"
          value = { username }
          onChange = { (e) => setUsername(e.target.value) }
        />
        <TextField
          margin = "dense"
          label = "密码"
          type = "password"
          fullWidth
          variant = "standard"
          value = { password }
          onChange = { (e) => setPassword(e.target.value) }
        />
      </DialogContent>
      <DialogActions>
        <Tooltip
          title = "取消"
        >
          <Button
            variant = "text"
            onClick = { handleCloseAction }
          >
            取消
          </Button>
        </Tooltip>
        <Tooltip
          title = "登录"
        >
          <Button
            variant = "contained"
            onClick = { handleLogin }
          >
            登录
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}
