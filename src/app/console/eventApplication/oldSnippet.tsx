import { ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Box, Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField, Typography
} from "@mui/material";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";

export function ListEventApplicationHorizontalControl(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  const [ society, setSociety ] = useState<string>("");
  const [ venue, setVenue ] = useState<string>("");
  const [ startTime, setStartTime ] = useState<string>("");
  const [ endTime, setEndTime ] = useState<string>("");
  const [ title, setTitle ] = useState<string>("");
  const [ description, setDescription ] = useState<string>("");
  const [ capacity, setCapacity ] = useState<string>("");
  const [ open, setOpen ] = useState<boolean>(false);
  const dispatch = useDispatch();
  const router = useRouter();

  function onClose() {
    setSociety("");
    setVenue("");
    setStartTime("");
    setEndTime("");
    setTitle("");
    setDescription("");
    setCapacity("");
    setOpen(false);
  }

  return (<Box
          sx = { {
            width: "100%",
            height: "100%"
          } }
  >
    <Dialog
            open = { open }
            onClose = { onClose }
    >
      <DialogTitle>
        申请活动
      </DialogTitle>
      <DialogContent>
        <TextField
                autoFocus
                margin = "dense"
                label = "社团"
                type = "text"
                fullWidth
                variant = "standard"
                value = { society }
                onChange = { e => setSociety(e.target.value) }
        >
        </TextField>
        <TextField
                margin = "dense"
                label = "场地"
                type = "text"
                fullWidth
                variant = "standard"
                value = { venue }
                onChange = { e => setVenue(e.target.value) }
        >
        </TextField>
        <TextField
                margin = "dense"
                label = "开始时间"
                type = "text"
                fullWidth
                variant = "standard"
                value = { startTime }
                onChange = { e => setStartTime(e.target.value) }
        >
        </TextField>
        <TextField
                margin = "dense"
                label = "结束时间"
                type = "text"
                fullWidth
                variant = "standard"
                value = { endTime }
                onChange = { e => setEndTime(e.target.value) }
        >
        </TextField>
        <TextField
                margin = "dense"
                label = "活动名称"
                type = "text"
                fullWidth
                variant = "standard"
                value = { title }
                onChange = { e => setTitle(e.target.value) }
        >
        </TextField>
        <TextField
                margin = "dense"
                label = "活动描述"
                type = "text"
                fullWidth
                variant = "standard"
                value = { description }
                onChange = { e => setDescription(e.target.value) }
        >
        </TextField>
        <TextField
                margin = "dense"
                label = "容量"
                type = "text"
                fullWidth
                variant = "standard"
                value = { capacity }
                onChange = { e => setCapacity(e.target.value) }
        >
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button
                onClick = { onClose }
                variant = "text"
        >
          <Typography>取消</Typography>
        </Button>
        <Button
                variant = "contained"
                onClick = { () => {
                  if (!society || !venue || !startTime || !endTime || !title || !description || !capacity) {
                    alert("所有字段不能为空");
                    return;
                  }
                  fetch("/api/console/eventApplication/place", {
                    method: "POST",
                    body: JSON.stringify({
                      uuid: society,
                      venue,
                      timeRange: [ startTime, endTime ],
                      title,
                      description,
                      capacity
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
                              onClose();
                            }
                          }
                  );
                } }
        >
          <Typography>提交</Typography>
        </Button>
      </DialogActions>
    </Dialog>
  </Box>);
}