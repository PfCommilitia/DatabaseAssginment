"use client";

import { ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useDispatch } from "react-redux";

export default function UserControl(
        { consoleState }: { consoleState: ConsoleState }
) {
  const [ organisationId, setOrganisationId ] = useState<string>("");
  const [ societyId, setSocietyId ] = useState<string>("");
  const [ eventId, setEventId ] = useState<string>("");
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
                    label = "活动Id"
                    type = "text"
                    fullWidth
                    variant = "standard"
                    value = { eventId }
                    onChange = { (event) => {
                      setEventId(event.target.value);
                    } }
            ></TextField>
            <Button
                    variant = "contained"
                    onClick = { () => {
                      consoleState.filter.set({
                        page: [ "user" ],
                        organisationId: organisationId.split(",").map(str => str.trim()),
                        societyId: societyId.split(",").map(str => str.trim()),
                        eventId: eventId.split(",").map(str => str.trim())
                      });
                      dispatch(setFetching(true));
                    } }
            >
              <Typography>筛选</Typography>
            </Button>
          </Box>
  );
}