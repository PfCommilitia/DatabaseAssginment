"use client";

import { ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useDispatch } from "react-redux";

export default function OrganisationControl(
        { consoleState }: { consoleState: ConsoleState }
) {
  const [ organisationId, setOrganisationId ] = useState<string>("");
  const dispatch = useDispatch();

  return (
          <Box
                  display = "grid"
                  gridTemplateColumns = "1fr"
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
            <Button
                    variant = "contained"
                    onClick = { () => {
                      if (organisationId.split(",").filter(str => str.length).some(str => isNaN(parseInt(str.trim())))) {
                        alert("组织Id必须为数字");
                        return;
                      }
                      consoleState.filter.set({
                        page: [ "organisation" ],
                        organisationId: organisationId.split(",").filter(str => str.length).map(str => parseInt(str.trim()))
                      });
                      dispatch(setFetching(true));
                    } }
            >
              <Typography>筛选</Typography>
            </Button>
          </Box>
  );
}