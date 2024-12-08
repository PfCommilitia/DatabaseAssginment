"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField, Typography
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";

function applyForSociety(uuid: string, message: string) {
  return fetch("/api/console/societyApplication/place", {
    method: "POST",
    body: JSON.stringify({ society: uuid, message })
  });
}

export default function ApplyForSocietyDialog({ row, option, handleCloseAction }: {
  row: string | null,
  option: string | null,
  handleCloseAction: () => void
}) {
  const [ message, setMessage ] = useState<string>("");
  const router = useRouter();
  return (
          <Dialog
                  open = { option === "apply" }
                  onClose = { handleCloseAction }
          >
            <DialogTitle>社团申请</DialogTitle>
            <DialogContent>
              <TextField
                      autoFocus
                      margin = "dense"
                      label = "申请文本"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { message }
                      onChange = { (e) => setMessage(e.target.value) }
              ></TextField>
            </DialogContent>
            <DialogActions>
              <Button
                      onClick = { handleCloseAction }
                      variant = "text"
              >
                <Typography>取消</Typography>
              </Button>
              <Button
                      onClick = { () => {
                        if (!message.length) {
                          alert("申请文本不能为空");
                          return;
                        }
                        applyForSociety(row!, message).then(
                                response => {
                                  response.json().then(
                                          res => {
                                            if (res.error) {
                                              router.push(`/error?error=${ encodeURIComponent(res.error) }`);
                                            } else {
                                              alert("申请提交成功");
                                              handleCloseAction();
                                            }
                                          }
                                  );
                                }
                        );
                      } }
                      variant = "contained"
              >
                <Typography>
                提交
                </Typography>
              </Button>
            </DialogActions>
          </Dialog>
  );
}