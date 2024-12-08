"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField, Typography
} from "@mui/material";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export default function ApplyForEventDialog({ row, option, handleCloseAction }: {
  row: string | null,
  option: string | null,
  handleCloseAction: () => void
}) {
  const [ uuid, setUuid ] = useState<string>("");
  const [ society, setSociety ] = useState<string>("");
  const [ startTime, setStartTime ] = useState<Date>(new Date());
  const [ endTime, setEndTime ] = useState<Date>(new Date());
  const [ title, setTitle ] = useState<string>("");
  const [ description, setDescription ] = useState<string>("");
  const [ capacity, setCapacity ] = useState<string>("");
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/console/venue/acquireState", {
        method: "POST",
        body: JSON.stringify({ venue: row })
      });
      const data = (await response.json()).payload;
      setCapacity(data[6].toString());
    }

    if (option === "apply" && row) {
      setUuid(row);
      fetchData();
    }
  }, [ option, row ]);

  return (<Dialog
                  open = { option === "apply" }
                  onClose = { handleCloseAction }
          >
            <DialogTitle>申请活动</DialogTitle>
            <DialogContent>
              <TextField
                      autoFocus
                      margin = "dense"
                      label = "场所Id"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { uuid }
                      disabled
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "社团Id"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { society }
                      onChange = { (e) => setSociety(e.target.value) }
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "活动标题"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { title }
                      onChange = { (e) => setTitle(e.target.value) }
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "活动描述"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { description }
                      onChange = { (e) => setDescription(e.target.value) }
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "容量"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { capacity }
                      disabled
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "开始时间"
                      type = "datetime-local"
                      fullWidth
                      variant = "standard"
                      value = { startTime.toISOString().split(".")[0] }
                      onChange = { (e) => setStartTime(new Date(e.target.value)) }
              >
              </TextField>
              <TextField
                      margin = "dense"
                      label = "结束时间"
                      type = "datetime-local"
                      fullWidth
                      variant = "standard"
                      value = { endTime.toISOString().split(".")[0] }
                      onChange = { (e) => setEndTime(new Date(e.target.value)) }
              >
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button
                      onClick = { handleCloseAction }
                      variant = "text"
              >
                <Typography>
                  关闭
                </Typography>
              </Button>
              <Button
                      variant = "contained"
                      onClick = { () => {
                        if (!society || !uuid || !startTime || !endTime || !title || !description || !capacity) {
                          alert("所有字段不能为空");
                          return;
                        }
                        if (isNaN(parseInt(capacity))) {
                          alert("容量必须是数字");
                          return;
                        }
                        if (parseInt(capacity) <= 0) {
                          alert("容量必须大于0");
                          return;
                        }
                        if (startTime >= endTime) {
                          alert("开始时间必须早于结束时间");
                          return;
                        }
                        if (endTime.getTime() - startTime.getTime() > 4 * 60 * 60 * 1000) {
                          alert("活动持续时间不能超过4小时");
                          return;
                        }
                        if (startTime.getTime() - new Date().getTime() < 12 * 60 * 60 * 1000) {
                          alert("开始时间必须晚于当前时间12小时");
                          return;
                        }
                        if (startTime.getTime() - new Date().getTime() > 7 * 24 * 60 * 60 * 1000) {
                          alert("开始时间必须早于当前时间的7天后");
                          return;
                        }
                        fetch("/api/console/eventApplication/place", {
                          method: "POST",
                          body: JSON.stringify({
                            uuid: society,
                            venue: uuid,
                            timeRange: [ startTime.toString(), endTime.toString() ],
                            title,
                            description,
                            capacity: parseInt(capacity)
                          })
                        }).then(
                                response => {
                                  if (!response.ok) {
                                    response.json().then(
                                            res => {
                                              if (res && res.error) {
                                                router.push(`/error?error=${ encodeURIComponent(res.error) }`);
                                              } else {
                                                router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
                                              }
                                            }
                                    ).catch(() => {
                                      router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
                                    });
                                  } else {
                                    alert("活动申请成功");
                                    dispatch(setFetching(true));
                                    handleCloseAction();
                                  }
                                }
                        );
                      } }
              >
                <Typography>提交</Typography>
              </Button>
            </DialogActions>
          </Dialog>
  );
}
