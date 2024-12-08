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
                      setStartTime(new Date(event.target.value).toString());
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
                      setEndTime(new Date(event.target.value).toString());
                    } }
            ></TextField>
            <Box>
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
            <Box>
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
            <Box>
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
            <Box>
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
                      consoleState.filter.set({
                        page: [ "eventApplication" ],
                        societyId: societyId.split(",").map((s) => s.trim()),
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