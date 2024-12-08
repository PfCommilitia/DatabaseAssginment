"use client";

import { ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { Box, Button, Checkbox, TextField, Typography } from "@mui/material";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useDispatch } from "react-redux";

export default function EventParticipationControl(
        { consoleState }: { consoleState: ConsoleState }
) {
  const [ eventId, setEventId ] = useState<string>("");
  const [ applicantSocietyId, setApplicantSocietyId ] = useState<string>("");
  const [ applicantOrganisationId, setApplicantOrganisationId ] = useState<string>("");
  const [ applicant, setApplicant ] = useState<string>("");
  const [ status, setStatus ] = useState<string[]>([]);
  const [ eventStatus, setEventStatus ] = useState<string[]>([]);
  const [ filterActive, setFilterActive ] = useState<boolean>(false);

  const dispatch = useDispatch();

  return (
          <Box
                  display = "grid"
                  gridTemplateColumns = "1fr 1fr 1fr 1fr 1fr"
                  gridTemplateRows = "45% 45%"
                  gap = "1em"
                  sx = { {
                    width: "100%",
                    height: "100%"
                  } }
          >
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
            <TextField
                    margin = "dense"
                    label = "申请人社团Id"
                    type = "text"
                    fullWidth
                    variant = "standard"
                    value = { applicantSocietyId }
                    onChange = { (event) => {
                      setApplicantSocietyId(event.target.value);
                    } }
            ></TextField>
            <TextField
                    margin = "dense"
                    label = "申请人组织Id"
                    type = "text"
                    fullWidth
                    variant = "standard"
                    value = { applicantOrganisationId }
                    onChange = { (event) => {
                      setApplicantOrganisationId(event.target.value);
                    } }
            ></TextField>
            <TextField
                    margin = "dense"
                    label = "申请人学工号"
                    type = "text"
                    fullWidth
                    variant = "standard"
                    value = { applicant }
                    onChange = { (event) => {
                      setApplicant(event.target.value);
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
            <Box
                        display = "flex"
                        alignItems = "center"
            >
              <Checkbox
                      checked = { eventStatus.includes("approved") }
                      onChange = { (event) => {
                        if (event.target.checked) {
                          setEventStatus([ ...eventStatus, "approved" ]);
                        } else {
                          setEventStatus(eventStatus.filter((s) => s !== "approved"));
                        }
                      } }
              >
              </Checkbox>
              <Typography>仅显示已通过活动</Typography>
            </Box>
            <Button
                    variant = "contained"
                    onClick = { () => {
                      if (eventId.split(",").filter(str => str.length).some(str => isNaN(parseInt(str.trim())))) {
                        alert("活动Id必须为数字");
                        return;
                      }
                      if (applicantSocietyId.split(",").filter(str => str.length).some(str => isNaN(parseInt(str.trim())))) {
                        alert("申请人社团Id必须为数字");
                        return;
                      }
                      if (applicantOrganisationId.split(",").filter(str => str.length).some(str => isNaN(parseInt(str.trim())))) {
                        alert("申请人组织Id必须为数字");
                        return;
                      }
                      consoleState.filter.set({
                        page: [ "eventParticipation" ],
                        eventId: eventId.split(",").filter(str => str.length).map(str => parseInt(str.trim())),
                        applicantSocietyId: applicantSocietyId.split(",").filter(str => str.length).map(str => parseInt(str.trim())),
                        applicantOrganisationId: applicantOrganisationId.split(",").filter(str => str.length).map(str => parseInt(str.trim())),
                        applicant: applicant.split(",").filter(str => str.length).map(str => str.trim()),
                        status,
                        active: filterActive ? [ "" ] : [],
                        eventStatus
                      });
                      dispatch(setFetching(true));
                    } }
            >
              <Typography>筛选</Typography>
            </Button>
          </Box>
  );
}