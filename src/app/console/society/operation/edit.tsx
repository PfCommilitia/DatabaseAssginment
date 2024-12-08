"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField, Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useDispatch } from "react-redux";

function editSociety(uuid: string, name: string, description: string) {
  return fetch("/api/console/society/edit", {
    method: "POST",
    body: JSON.stringify({ society: uuid, name, description })
  });
}

export default function EditSocietyDialog({ row, option, handleCloseAction }: {
  row: string | null,
  option: string | null,
  handleCloseAction: () => void
}) {
  const [ name, setName ] = useState<string>("");
  const [ description, setDescription ] = useState<string>("");
  const [ loading, setLoading ] = useState<boolean>(true);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/console/society/acquireState", {
        method: "POST",
        body: JSON.stringify({ society: row })
      });
      const data = await response.json();
      setName(data.payload[1]);
      setDescription(data.payload[6]);
      setLoading(false);
    }

    if (option === "edit" && row) {
      fetchData();
    }
  }, [ option, row ]);

  return (<Dialog
          open = { option === "edit" }
          onClose = { handleCloseAction }
  >
    <DialogTitle>编辑社团信息</DialogTitle>
    <DialogContent>
      <TextField
              autoFocus
              margin = "dense"
              label = "社团名称"
              type = "text"
              fullWidth
              variant = "standard"
              value = { name }
              disabled = { loading }
              onChange = { (e) => setName(e.target.value) }
      ></TextField>
      <TextField
              margin = "dense"
              label = "社团描述"
              type = "text"
              fullWidth
              variant = "standard"
              value = { description }
              disabled = { loading }
              onChange = { (e) => setDescription(e.target.value) }
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
                if (!name || !description) {
                  alert("社团名称和描述不能为空");
                  return;
                }
                editSociety(row!, name, description).then(
                        response => {
                          if (!response.ok) {
                            response.json().then(
                                    res => {
                                      if (res && res.error) {
                                        router.push(`/error?error=${ encodeURIComponent(res.error) }`);
                                      }
                                    }
                            );
                          } else {
                            alert("社团信息修改成功");
                            dispatch(setFetching(true));
                            handleCloseAction();
                          }
                        }
                ).catch(() => {
                  router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
                });
              } }
              variant = "contained"
      >
        <Typography>提交</Typography>
      </Button>
    </DialogActions>
  </Dialog>);
}