"use client";

import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { NotLoggedIn } from "@/app/dependencies/sharedComponents/notLoggedIn";
import {
  Box,
  Button,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle, TextField, Tooltip,
  Typography
} from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import FootBar from "@/app/dependencies/sharedComponents/footBar";
import { useInitSession } from "@/app/dependencies/lib/initSession";
import { useEffect, useState } from "react";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_TOO_SIMPLE_PASSWORD } from "@/app/dependencies/error/databaseTrigger";

interface UserInfo {
  username: string;
  name: string;
  organisationName: string;
  initialized: boolean;
}

function ChangePasswordDialog({ open, handleCloseAction }: {
  open: boolean, handleCloseAction: () => void
}) {
  const [ password, setPassword ] = useState("");
  const [ passwordNew, setPasswordNew ] = useState("");
  const [ passwordConfirm, setPasswordConfirm ] = useState("");
  const session = useSelector((state: RootState) => state.session.session);

  async function handleChangePassword() {
    if (!session) {
      alert("修改密码失败。错误代码：" + ERROR_SESSION_NOT_FOUND.code);
      return;
    }
    if (!session.user?.name) {
      alert("修改密码失败。错误代码：" + ERROR_NO_USER_IN_SESSION.code);
      return;
    }
    if (passwordNew !== passwordConfirm) {
      alert("修改密码失败。新密码与确认密码不一致。");
      return;
    }
    if (password === passwordNew) {
      alert("修改密码失败。新密码与输入的旧密码相同。");
    }
    if (passwordNew === "") {
      return;
    }
    const validateLogin = await fetch("/api/user/changePassword", {
      method: "POST",
      body: JSON.stringify({
        username: session.user.name,
        password: password,
        passwordNew: passwordNew
      })
    });
    if (!validateLogin.ok) {
      const code = (await validateLogin.json()).error;
      if (code === ERROR_TOO_SIMPLE_PASSWORD.code) {
        alert("修改密码失败。新密码必须包含数字、小写字母、大写字母和特殊符号，且长度不小于8。请检查密码复杂度，以及是否使用了未允许的字符。");
        return;
      }
      alert("修改密码失败。错误代码：" + (await validateLogin.json()).error);
    }
    handleCloseAction();
  }

  return (
          <Dialog open = { open } onClose = { handleCloseAction }>
            <DialogTitle>
              修改密码
            </DialogTitle>
            <DialogContent>
              <TextField
                      margin = "dense"
                      label = "密码"
                      type = "password"
                      fullWidth
                      variant = "standard"
                      value = { password }
                      onChange = { (e) => setPassword(e.target.value) }
              />
              <TextField
                      margin = "dense"
                      label = "新密码"
                      type = "password"
                      fullWidth
                      variant = "standard"
                      value = { passwordNew }
                      onChange = { (e) => setPasswordNew(e.target.value) }
              />
              <TextField
                      margin = "dense"
                      label = "确认密码"
                      type = "password"
                      fullWidth
                      variant = "standard"
                      value = { passwordConfirm }
                      onChange = { (e) => setPasswordConfirm(e.target.value) }
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
                      title = "确认"
              >
                <Button
                        variant = "contained"
                        onClick = { handleChangePassword }
                >
                  确认
                </Button>
              </Tooltip>
            </DialogActions>
          </Dialog>
  );
}

function UserInfoBox(): JSX.Element {
  const router = useRouter();
  const [ userInfo, setUserInfo ] = useState<UserInfo | null>(null);
  const [ showChangePassword, setShowChangePassword ] = useState(false);

  useEffect(() => {
    async function fetchSetUserInfo() {
      const res = await fetch("/api/user/fetchInfo", {
        method: "POST"
      });
      if (!res.ok) {
        alert("获取用户信息失败。错误代码：" + (await res.json()).error);
        return;
      }
      const info = await res.json();
      setUserInfo(info.payload);
    }

    fetchSetUserInfo();
  }, [ router ]);

  return (
          <Box
                  sx = { {
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                    width: "100%",
                    height: "80%"
                  } }
          >
            <ChangePasswordDialog
                    open = { showChangePassword }
                    handleCloseAction = { () => setShowChangePassword(false) }
            />
            <Box
                    sx = { {
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      height: "100%"
                    } }
            >
              <Box
                      sx = { {
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                        height: "100%"
                      } }
              >
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          fontWeight: "bold",
                          height: "15%"
                        } }
                >
                  学工号
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          fontWeight: "bold",
                          height: "15%"
                        } }
                >
                  姓名
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          fontWeight: "bold",
                          height: "15%"
                        } }
                >
                  组织名称
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          fontWeight: "bold",
                          height: "15%"
                        } }
                >
                  密码
                </Typography>
              </Box>
              <Box
                      sx = { {
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 8,
                        height: "100%"
                      } }
              >
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          height: "15%"
                        } }
                >
                  { userInfo ? userInfo.username : "" }
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          height: "15%"
                        } }
                >
                  { userInfo ? userInfo.name : "" }
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          height: "15%"
                        } }
                >
                  { userInfo ? userInfo.organisationName : "" }
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          height: "15%"
                        } }
                >
                  { userInfo ? (userInfo.initialized ? "已设置" : "未设置") : "" }
                </Typography>
              </Box>
              <Box
                      sx = { {
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        flexGrow: 1,
                        height: "100%"
                      } }
              >
                <Box
                        className = "placeholder"
                        sx = { {
                          height: "15%"
                        } }
                ></Box>
                <Box
                        className = "placeholder"
                        sx = { {
                          height: "15%"
                        } }
                ></Box>
                <Box
                        className = "placeholder"
                        sx = { {
                          height: "15%"
                        } }
                ></Box>
                <Box
                        sx = { {
                          display: "flex",
                          alignItems: "center",
                          height: "15%"
                        } }
                >
                  <Tooltip
                          title = "修改密码"
                  >
                    <Button
                            variant = { userInfo?.initialized ? "contained" : "outlined" }
                            color = "info"
                            sx = { {
                              minHeight: "33%",
                              maxHeight: "33%"
                            } }
                            onClick = { () => setShowChangePassword(true) }
                    >
                      <Typography
                              sx = { {
                                paddingY: "0.1em",
                                lineHeight: "1.5em",
                                color: userInfo?.initialized ? "primary.contrastText" : undefined
                              } }
                      >
                        修改密码
                      </Typography>
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>
  );
}

function UserInfoPage(): JSX.Element {
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
                      minWidth: "70%",
                      maxWidth: "100%",
                      height: "80%"
                    } }
            >
              <Box
                      sx = { {
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%"
                      } }
              >
                <Box sx = { { width: "100%", height: "10%" } }></Box>
                <Box
                        sx = { {
                          display: "grid",
                          width: "100%",
                          height: "10%"
                        } }
                >
                  <Typography
                          variant = "h5"
                          sx = { {
                            paddingY: "0.1em",
                            lineHeight: "1.5em",
                            marginLeft: "1em"
                          } }
                  >
                    用户信息
                  </Typography>
                </Box>
                <UserInfoBox></UserInfoBox>
              </Box>
            </Box>
            <FootBar></FootBar>
          </Box>
  );
}

function ContentSession(): JSX.Element {
  const session = useSelector((state: RootState) => state.session.session);
  if (!session) {
    return (<NotLoggedIn></NotLoggedIn>);
  }
  return (<UserInfoPage></UserInfoPage>);
}

export default function UserInfo() {
  useInitSession();

  return (<ContentSession></ContentSession>);
}
