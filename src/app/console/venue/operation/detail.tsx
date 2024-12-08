"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField, Typography
} from "@mui/material";

export default function ViewVenueDialog({ row, option, handleCloseAction }: {
  row: number | null,
  option: string | null,
  handleCloseAction: () => void
}) {
  const [ uuid, setUuid ] = useState<number>(0);
  const [ name, setName ] = useState<string>("");
  const [ address, setAddress ] = useState<string>("");
  const [ description, setDescription ] = useState<string>("");
  const [ isAvailable, setIsAvailable ] = useState<string>("");
  const [ organisationName, setOrganisationName ] = useState<string>("");
  const [ capacity, setCapacity ] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/console/venue/acquireState", {
        method: "POST",
        body: JSON.stringify({ venue: row })
      });
      const data = (await response.json()).payload;
      setUuid(data[0]);
      setName(data[1]);
      setAddress(data[2]);
      setDescription(data[3]);
      setIsAvailable(data[4] ? "是" : "否");
      setOrganisationName(data[5]);
      setCapacity(data[6].toString());
    }

    if (option === "view" && row) {
      fetchData();
    }
  }, [ option, row ]);

  return (<Dialog
                  open = { option === "view" }
                  onClose = { handleCloseAction }
          >
            <DialogTitle>查看场所信息</DialogTitle>
            <DialogContent>
              <TextField
                      autoFocus
                      margin = "dense"
                      label = "场所Id"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { uuid.toString() }
                      disabled
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "场所名称"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { name }
                      disabled
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "地址"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { address }
                      disabled
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "描述"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { description }
                      disabled
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "是否可用"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { isAvailable }
                      disabled
              ></TextField>
              <TextField
                      margin = "dense"
                      label = "所属组织"
                      type = "text"
                      fullWidth
                      variant = "standard"
                      value = { organisationName }
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
            </DialogContent>
            <DialogActions>
              <Button
                      onClick = { handleCloseAction }
                      variant = "text"
              >
                <Typography>
                  关闭
                </Typography>
              </Button>
            </DialogActions>
          </Dialog>
  );
}
