"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions, DialogContent,
  DialogTitle,
  TextField,
  Tooltip
} from "@mui/material";
import { getSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useDispatch } from "react-redux";
import { setSession } from "@/app/dependencies/redux/stateSlices/session";
import { useRouter } from "next/navigation";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { ERROR_INVALID_PASSWORD } from "@/app/dependencies/error/databaseTrigger";

export default function LoginDialog({ open, handleCloseAction }: {
  open: boolean,
  handleCloseAction: () => void,
}) {
  const [ username, setUsername ] = useState("");
  const [ password, setPassword ] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();

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
        router.push(`/error?error=${ encodeURIComponent(ERROR_INVALID_PASSWORD.code) }`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
    }
  }

  return (
          <Dialog open = { open } onClose = { handleCloseAction }>
            <DialogTitle>用户登录</DialogTitle>
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
