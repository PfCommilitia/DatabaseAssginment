"use client";

import {
  Box,
  Button,
  Menu,
  MenuItem, Table, TableBody,
  TableCell, TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { useRouter } from "next/navigation";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import {
  AppRouterInstance
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import ViewVenueDialog from "@/app/console/venue/operation/detail";
import ApplyForEventDialog from "@/app/console/venue/operation/applyEvent";
import { ConsoleState } from "@/app/console/types";

type VenueWithRole = [
  number, // uuid
  string, // name
  string, // address
  string, // description
  boolean, // isAvailable
  string, // Organisation.Name
  number, // capacity
  string, // imageURL
  boolean // permission
]

interface VenueRowProps {
  anchorEl: HTMLElement | null;
  selectedRow: number | null;
  selectedOption: string | null;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, rowId: number) => void;
  handleMenuClose: () => void;
  handleMenuSelect: (uuid: number, option: string) => void;
  handleDialogClose: () => void;
}

function VenueRow(router: AppRouterInstance, onSuccess: () => void, item: VenueWithRole, props: VenueRowProps) {
  const uuid = item[0];
  const name = item[1];
  const address = item[2];
  const isAvailable = item[4];
  const organisation = item[5];
  const capacity = item[6];
  const permission = item[8];

  return (<TableRow
          key = { uuid }
          sx = { {
            height: "6%",
            verticalAlign: "top"
          } }
  >
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { uuid }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "20%"
            } }
    >
      <Typography>
        { name }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "20%"
            } }
    >
      <Typography>
        { address }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "20%"
            } }
    >
      <Typography>
        { organisation }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { isAvailable ? "是" : "否" }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { capacity }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "20%"
            } }
    >
      <Button
              variant = "contained"
              onClick = { (e) => props.handleMenuOpen(e, uuid) }
      >
        <Typography>操作</Typography>
      </Button>
      <Menu
              anchorEl = { props.anchorEl }
              open = { Boolean(props.anchorEl) && props.selectedRow === uuid }
              onClose = { props.handleMenuClose }
      >
        <MenuItem
                onClick = { () => {
                  props.handleMenuSelect(uuid, "view");
                } }
        >
          <Typography>查看</Typography>
        </MenuItem>
        {
          permission ? (<MenuItem
                  onClick = { () => {
                    props.handleMenuSelect(uuid, "apply");
                  } }
          >
            <Typography>申请活动</Typography>
          </MenuItem>) : null
        }
      </Menu>
    </TableCell>
  </TableRow>);
}

export default function View(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  const [ data, setData ] = useState<VenueWithRole[] | null>(null);
  const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);
  const [ selectedOption, setSelectedOption ] = useState<string | null>(null);
  const [ selectedRow, setSelectedRow ] = useState<number | null>(null);
  const [ init, setInit ] = useState<boolean>(false);
  const dispatch = useDispatch();
  const fetching = useSelector((state: RootState) => state.session.fetching);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const filter = consoleState.filter.get();
      let filterOrganisationHierarchy = null;
      let filterTimeRangeAvailability = null;
      if (filter.page?.[0] === "venue") {
        filterOrganisationHierarchy = filter.organisationId?.length ? filter.organisationId : null;
        filterTimeRangeAvailability = filter.timeRange?.length ? filter.timeRange : null;
      } else if (filter.page) {
        consoleState.filter.set({});
      }
      const response = await fetch("/api/console/venue/list", {
        method: "POST",
        body: JSON.stringify({
          filterAvailable: null,
          filterOrganisations: null,
          filterOrganisationHierarchy: filterOrganisationHierarchy,
          filterTimeRangeAvailability: filterTimeRangeAvailability,
          filterManaged: null
        })
      });
      if (!response.ok) {
        const error = await response.json();
        if (error && error.error) {
          router.push(`/error?error=${ encodeURIComponent(error.error) }`);
        } else {
          router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
        }
      }
      const data = await response.json();

      const res1 = await fetch("/api/console/user/anyPermission", {
        method: "POST"
      });
      if (!res1.ok) {
        const error = await res1.json();
        if (error && error.error) {
          router.push(`/error?error=${ encodeURIComponent(error.error) }`);
        } else {
          router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
        }
      }
      const permission = (await res1.json()).payload;
      for (const venue of data.payload) {
        venue.push(permission);
      }

      setData(data.payload);
    }

    if (!init) {
      setInit(true);
      fetchData();
      return;
    } else if (fetching) {
      dispatch(setFetching(false));
      fetchData();
    }
  }, [consoleState.filter, dispatch, fetching, init, router]);

  function handleMenuOpen(event: React.MouseEvent<HTMLElement>, rowId: number) {
    setAnchorEl(event.currentTarget);
    setSelectedRow(rowId);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function handleMenuSelect(uuid: number, option: string) {
    setSelectedRow(uuid);
    setSelectedOption(option);
    handleMenuClose();
  }

  function handleDialogClose() {
    setSelectedRow(null);
    setSelectedOption(null);
  }

  function onSuccess() {
    dispatch(setFetching(true));
  }

  const eventApplicationViewProps: VenueRowProps = {
    anchorEl,
    selectedRow,
    selectedOption,
    handleMenuOpen,
    handleMenuClose,
    handleMenuSelect,
    handleDialogClose
  };

  return (
          <Box
                  sx = { {
                    width: "100%",
                    height: "100%",
                    overflowX: "auto"
                  } }
          >
            <ViewVenueDialog row = { selectedRow } option = { selectedOption }
                             handleCloseAction = { handleDialogClose }/>
            <ApplyForEventDialog row = { selectedRow } option = { selectedOption }
                                 handleCloseAction = { handleDialogClose }/>
            <Table
                    sx = { {
                      width: "100%",
                      height: "100%"
                    } }
            >
              <TableHead>
                <TableRow>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      场地Id
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "20%"
                          } }
                  >
                    <Typography>
                      场地名称
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "20%"
                          } }
                  >
                    <Typography>
                      地址
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "20%"
                          } }
                  >
                    <Typography>
                      所属组织
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      是否可用
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      容量
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "20%"
                          } }
                  >
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                        data && data.map(item => VenueRow(router, onSuccess, item, eventApplicationViewProps))
                }
              </TableBody>
            </Table>
          </Box>
  );
}
