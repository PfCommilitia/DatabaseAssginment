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
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";

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
  const [ passwordMismatch, setPasswordMismatch ] = useState(false);
  const router = useRouter();

  async function handleChangePassword() {
    if (passwordNew !== passwordConfirm) {
      setPasswordMismatch(true);
      return;
    }
    try {
      const validateLogin = await fetch("/api/changePassword", {
        method: "POST",
        body: JSON.stringify({
          username: "admin",
          password: password,
          passwordNew: passwordNew
        })
      });
      if (!validateLogin.ok) {
        const error = await validateLogin.json();
        if (error && error.error) {
          router.push(`/error?error=${ encodeURIComponent(error.error) }`);
        } else {
          router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
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
                      sx = { { color: passwordMismatch ? "error.main" : undefined } }
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
      const res = await fetch("/api/fetchUserInfo", {
        method: "POST"
      });
      if (!res.ok) {
        const error = await res.json();
        if (error && error.error) {
          router.push(`/error?error=${ encodeURIComponent(error.error) }`);
        } else {
          router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
        }
      }
      const info = await res.json();
      setUserInfo(info);
    }

    fetchSetUserInfo();
  }, [ router ]);

  return (
          <>
            <ChangePasswordDialog
                    open = { showChangePassword }
                    handleCloseAction = { () => setShowChangePassword(false) }
            />
            <Box
                    sx = { {
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      minHeight: "62.5vh",
                      maxHeight: "67.5vh"
                    } }
            >
              <Box
                      sx = { {
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                        minHeight: "62.5vh",
                        maxHeight: "67.5vh"
                      } }
              >
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          fontWeight: "bold",
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
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
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
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
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
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
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
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
                        minHeight: "62.5vh",
                        maxHeight: "67.5vh"
                      } }
              >
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
                        } }
                >
                  { userInfo ? userInfo.username : "" }
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
                        } }
                >
                  { userInfo ? userInfo.name : "" }
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
                        } }
                >
                  { userInfo ? userInfo.organisationName : "" }
                </Typography>
                <Typography
                        sx = { {
                          paddingY: "0.1em",
                          lineHeight: "1.5em",
                          marginLeft: "1em",
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
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
                        minHeight: "62.5vh",
                        maxHeight: "67.5vh"
                      } }
              >
                <Box
                        className = "placeholder"
                        sx = { {
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
                        } }
                ></Box>
                <Box
                        className = "placeholder"
                        sx = { {
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
                        } }
                ></Box>
                <Box
                        className = "placeholder"
                        sx = { {
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
                        } }
                ></Box>
                <Box
                        sx = { {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
                        } }
                >
                  <Tooltip
                          title = "修改密码"
                  >
                    <Button
                            variant = { userInfo?.initialized ? "contained" : "outlined" }
                            color = "info"
                            sx = { {
                              minHeight: "4vh",
                              maxHeight: "4vh"
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
          </>
  );
}

function UserInfoPage(): JSX.Element {
  return (
          <Box
                  sx = { {
                    alignItems: "center",
                    justifyItems: "center",
                    width: "100%",
                    minHeight: "100vh",
                    maxHeight: "100vh"
                  } }
          >
            <TopBar></TopBar>
            <Box
                    sx = { {
                      display: "grid",
                      alignItems: "center",
                      minWidth: "70vw",
                      maxWidth: "100vw",
                      minHeight: "80vh",
                      maxHeight: "80vh"
                    } }
            >
              <Box
                      sx = { {
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        width: "100%",
                        minHeight: "75vh",
                        maxHeight: "80vh"
                      } }
              >
                <Box sx = { { width: "100%", minHeight: "5vh", maxHeight: "5vh" } }></Box>
                <Box
                        sx = { {
                          display: "grid",
                          width: "100%",
                          minHeight: "7.5vh",
                          maxHeight: "7.5vh"
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
