"use client";

import { ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { Box, Button, Checkbox, TextField, Typography } from "@mui/material";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useDispatch } from "react-redux";

export default function EventApplicationControl(
        { consoleState }: { consoleState: ConsoleState }
) {
  const [ societyId, setSocietyId ] = useState<string>("");
  const [ startTime, setStartTime ] = useState<string>("");
  const [ endTime, setEndTime ] = useState<string>("");
  const [ status, setStatus ] = useState<string[]>([]);
  const [ filterActive, setFilterActive ] = useState<boolean>(false);

  const dispatch = useDispatch();

  return (
          <Box
                  display = "grid"
                  gridTemplateColumns = "1fr 1fr 1fr 1fr"
                  gridTemplateRows = "45% 45%"
                  gap = "1em"
                  sx = { {
                    width: "100%",
                    height: "100%"
                  } }
          >
            <TextField
                    margin = "dense"
                    label = "社团Id"
                    type = "text"
                    fullWidth
                    variant = "standard"
                    value = { societyId }
                    onChange = { (event) => {
                      setSocietyId(event.target.value);
                    } }
            ></TextField>
            <TextField
                    margin = "dense"
                    label = "开始时间"
                    type = "datetime-local"
                    fullWidth
                    variant = "standard"
                    value = { startTime }
                    onChange = { (event) => {
                      setStartTime(event.target.value);
                    } }
            ></TextField>
            <TextField
                    margin = "dense"
                    label = "结束时间"
                    type = "datetime-local"
                    fullWidth
                    variant = "standard"
                    value = { endTime }
                    onChange = { (event) => {
                      setEndTime(event.target.value);
                    } }
            ></TextField>
            <Box
                    display = "flex"
                    alignItems = "center"
            >
              <Checkbox
                      checked = { status.includes("approved") }
                      onChange = { (event) => {
                        if (event.target.checked) {
                          setStatus([ ...status, "approved" ]);
                        } else {
                          setStatus(status.filter((s) => s !== "approved"));
                        }
                      } }
              >
              </Checkbox>
              <Typography>已通过</Typography>
            </Box>
            <Box
                    display = "flex"
                    alignItems = "center"
            >
              <Checkbox
                      checked = { status.includes("rejected") }
                      onChange = { (event) => {
                        if (event.target.checked) {
                          setStatus([ ...status, "rejected" ]);
                        } else {
                          setStatus(status.filter((s) => s !== "rejected"));
                        }
                      } }
              >
              </Checkbox>
              <Typography>已拒绝</Typography>
            </Box>
            <Box
                    display = "flex"
                    alignItems = "center"
            >
              <Checkbox
                      checked = { status.includes("pending") }
                      onChange = { (event) => {
                        if (event.target.checked) {
                          setStatus([ ...status, "pending" ]);
                        } else {
                          setStatus(status.filter((s) => s !== "pending"));
                        }
                      } }
              >
              </Checkbox>
              <Typography>待审核</Typography>
            </Box>
            <Box
                    display = "flex"
                    alignItems = "center"
            >
              <Checkbox
                      checked = { filterActive }
                      onChange = { (event) => {
                        setFilterActive(event.target.checked);
                      } }
              >
              </Checkbox>
              <Typography>仅显示有效</Typography>
            </Box>
            <Button
                    variant = "contained"
                    onClick = { () => {
                      if (societyId.split(",").filter(str => str.length).some((s) => isNaN(parseInt(s.trim())))) {
                        alert("社团Id必须为数字");
                        return;
                      }
                      if ((startTime || endTime) && (!startTime || !endTime)) {
                        alert("开始时间和结束时间必须同时填写");
                        return;
                      }
                      if ((startTime && endTime) && ((new Date(startTime)).getTime() > (new Date(endTime)).getTime())) {
                        alert("开始时间不能晚于结束时间");
                        return;
                      }
                      consoleState.filter.set({
                        page: [ "eventApplication" ],
                        societyId: societyId.split(",").filter(str => str.length).map((s) => parseInt(s.trim())),
                        timeRange: startTime && endTime ? [ startTime, endTime ] : [],
                        status,
                        active: filterActive ? [ "" ] : []
                      });
                      dispatch(setFetching(true));
                    } }
            >
              <Typography>筛选</Typography>
            </Button>
          </Box>
  );
}