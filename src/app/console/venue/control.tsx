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
            <Button
                    variant = "contained"
                    onClick = { () => {
                      consoleState.filter.set({
                        page: [ "venue" ],
                        organisationId: organisationId.split(",").map(str => str.trim()),
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