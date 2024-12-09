"use client";

import { ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useDispatch } from "react-redux";

export default function VenueControl(
        { consoleState }: { consoleState: ConsoleState }
) {
  const [ organisationId, setOrganisationId ] = useState<string>("");
  const [ startTime, setStartTime ] = useState<string>("");
  const [ endTime, setEndTime ] = useState<string>("");

  const dispatch = useDispatch();

  return (
          <Box
                  display = "grid"
                  gridTemplateColumns = "1fr 1fr"
                  gridTemplateRows = "45% 45%"
                  gap = "1em"
                  sx = { {
                    width: "100%",
                    height: "100%"
                  } }
          >
            <TextField
                    margin = "dense"
                    label = "组织Id"
                    type = "text"
                    fullWidth
                    variant = "standard"
                    value = { organisationId }
                    onChange = { (event) => {
                      setOrganisationId(event.target.value);
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
            <Button
                    variant = "contained"
                    onClick = { () => {
                      if (organisationId.split(",").filter(str => str.length).some(str => isNaN(parseInt(str.trim())))) {
                        alert("组织Id必须为数字");
                        return;
                      }
                      if ((startTime || endTime) && (!startTime || !endTime)) {
                        alert("开始时间和结束时间必须同时填写");
                        return;
                      }
                      if (startTime && endTime && (new Date(startTime).getTime() > new Date(endTime).getTime())) {
                        alert("开始时间不能晚于结束时间");
                        return;
                      }
                      consoleState.filter.set({
                        page: [ "venue" ],
                        organisationId: organisationId.split(",").filter(str => str.length).map(str => parseInt(str.trim())),
                        timeRange: startTime && endTime ? [ startTime, endTime ] : []
                      });
                      dispatch(setFetching(true));
                    } }
            >
              <Typography>筛选</Typography>
            </Button>
          </Box>
  );
}