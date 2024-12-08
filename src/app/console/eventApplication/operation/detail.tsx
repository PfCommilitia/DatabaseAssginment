"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField, Typography
} from "@mui/material";
import {
  AppRouterInstance
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";

function approveEventApplication(router: AppRouterInstance, onSuccess: () => void, uuid: number, message: string, result: boolean) {
  fetch("/api/console/eventApplication/approve", {
    method: "POST",
    body: JSON.stringify({
      uuid,
      result,
      comment: message
    })
  }).then(
          res => {
            if (!res.ok) {
              res.json().then(
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
              return;
            }
            alert("审核成功");
            onSuccess();
          }
  );
}

export default function ViewEventApplicationDialog({ row, option, handleCloseAction }: {
  row: number | null,
  option: string | null,
  handleCloseAction: () => void
}) {
  const [ uuid, setUuid ] = useState<number>(0);
  const [ applicant, setApplicant ] = useState<string>("");
  const [ society, setSociety ] = useState<string>("");
  const [ venue, setVenue ] = useState<string>("");
  const [ startTime, setStartTime ] = useState<string>("");
  const [ endTime, setEndTime ] = useState<string>("");
  const [ isActive, setIsActive ] = useState<string>("");
  const [ status, setStatus ] = useState<string>("");
  const [ title, setTitle ] = useState<string>("");
  const [ description, setDescription ] = useState<string>("");
  const [ capacity, setCapacity ] = useState<string>("");
  const [ message, setMessage ] = useState<string>("");
  const [ permission, setPermission ] = useState<string[]>([]);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/console/eventApplication/acquireState", {
        method: "POST",
        body: JSON.stringify({ eventApplication: row })
      });
      const data = (await response.json()).payload;
      setUuid(data[0]);
      setApplicant(data[1]);
      setSociety(data[2]);
      setVenue(data[3]);
      setStartTime(new Date(data[4][0]).toLocaleString("zh-Hans-CN"));
      setEndTime(new Date(data[4][1]).toLocaleString("zh-Hans-CN"));
      setTitle(data[5]);
      setDescription(data[6]);
      setIsActive(data[7] ? "是" : "否");
      setCapacity(data[8].toString());
      setStatus({
        "approved": "已通过",
        "rejected": "已拒绝",
        "pending": "待审核"
      }[data[9] as "approved" | "rejected" | "pending"]);
      const res1 = await fetch("/api/console/eventApplication/getPermission", {
        method: "POST",
        body: JSON.stringify({ uuid: row })
      });
      const permission = await res1.json();
      setPermission(permission.payload);
    }

    if (option === "view" && row) {
      fetchData();
    }
  }, [ option, row ]);

  function onSuccess() {
    dispatch(setFetching(true));
    handleCloseAction();
  }

  return (<Dialog
          open = { option === "view" }
          onClose = { handleCloseAction }
  >
    <DialogTitle>查看活动申请</DialogTitle>
    <DialogContent>
      <TextField
              autoFocus
              margin = "dense"
              label = "活动Id"
              type = "text"
              fullWidth
              variant = "standard"
              value = { uuid.toString() }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "申请人"
              type = "text"
              fullWidth
              variant = "standard"
              value = { applicant }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "社团"
              type = "text"
              fullWidth
              variant = "standard"
              value = { society }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "场地"
              type = "text"
              fullWidth
              variant = "standard"
              value = { venue }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "开始时间"
              type = "text"
              fullWidth
              variant = "standard"
              value = { startTime }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "结束时间"
              type = "text"
              fullWidth
              variant = "standard"
              value = { endTime }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "活动名称"
              type = "text"
              fullWidth
              variant = "standard"
              value = { title }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "活动描述"
              type = "text"
              fullWidth
              variant = "standard"
              value = { description }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "是否有效"
              type = "text"
              fullWidth
              variant = "standard"
              value = { isActive }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "状态"
              type = "text"
              fullWidth
              variant = "standard"
              value = { status }
              disabled
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
      {
        permission.includes("admin") || permission.includes("approve") ? (
                <TextField
                        margin = "dense"
                        label = "审核信息"
                        type = "text"
                        fullWidth
                        variant = "standard"
                        value = { message }
                        disabled = { status !== "待审核" }
                        onChange = { (e) => setMessage(e.target.value) }
                ></TextField>
        ) : null
      }
    </DialogContent>
    <DialogActions>
      {
        status === "待审核" &&
        (permission.includes("admin") || permission.includes("approve")) ? (
                <Button
                        onClick = { () => {
                          if (!message) {
                            alert("审核信息不能为空");
                            return;
                          }
                          approveEventApplication(router, onSuccess, uuid, message, true);
                        } }
                        variant = "contained"
                >
                  <Typography>
                    通过
                  </Typography>
                </Button>
        ) : null
      }
      {
        status === "待审核" &&
        (permission.includes("admin") || permission.includes("approve")) ? (
                <Button
                        onClick = { () => {
                          if (message === "") {
                            alert("审核信息不能为空");
                            return;
                          }
                          approveEventApplication(router, onSuccess, uuid, message, false);
                        } }
                        variant = "contained"
                >
                  <Typography>
                    拒绝
                  </Typography>
                </Button>
        ) : null
      }
      <Button
              onClick = { handleCloseAction }
              variant = "text"
      >
        <Typography>
          关闭
        </Typography>
      </Button>
    </DialogActions>
  </Dialog>);
}