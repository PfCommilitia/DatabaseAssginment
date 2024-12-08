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

function approveEventParticipation(router: AppRouterInstance, onSuccess: () => void, uuid: number, message: string, result: boolean) {
  fetch("/api/console/eventParticipation/approve", {
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

export default function ViewEventParticipationDialog({ row, option, handleCloseAction }: {
  row: number | null,
  option: string | null,
  handleCloseAction: () => void
}) {
  const [ uuid, setUuid ] = useState<number>(0);
  const [ applyingEvent, setApplyingEvent ] = useState<number>(0);
  const [ applicant, setApplicant ] = useState<string>("");
  const [ timestamp, setTimestamp ] = useState<string>("");
  const [ isActive, setIsActive ] = useState<string>("");
  const [ status, setStatus ] = useState<string>("");
  const [ message, setMessage ] = useState<string>("");
  const [ permission, setPermission ] = useState<string[]>([]);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/console/eventParticipation/acquireState", {
        method: "POST",
        body: JSON.stringify({ eventParticipation: row })
      });
      const data = (await response.json()).payload;
      setUuid(data[0]);
      setApplyingEvent(data[1]);
      setApplicant(data[2]);
      setTimestamp(new Date(data[7]).toLocaleString("zh-Hans-CN"));
      setIsActive(data[10] ? "是" : "否");
      setStatus({
        "approved": "已通过",
        "rejected": "已拒绝",
        "pending": "待审核"
      }[data[12] as "approved" | "rejected" | "pending"]);
      const res1 = await fetch("/api/console/eventParticipation/getPermission", {
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
    <DialogTitle>查看活动参与申请</DialogTitle>
    <DialogContent>
      <TextField
              autoFocus
              margin = "dense"
              label = "申请Id"
              type = "text"
              fullWidth
              variant = "standard"
              value = { uuid.toString() }
              disabled
      ></TextField>
      <TextField
              margin = "dense"
              label = "申请活动Id"
              type = "text"
              fullWidth
              variant = "standard"
              value = { applyingEvent.toString() }
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
              label = "申请时间"
              type = "text"
              fullWidth
              variant = "standard"
              value = { timestamp }
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
                          approveEventParticipation(router, onSuccess, uuid, message, true);
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
                          approveEventParticipation(router, onSuccess, uuid, message, false);
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
