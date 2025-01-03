"use client";

import { ConsoleState } from "@/app/console/types";
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
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import ViewEventApplicationDialog from "@/app/console/eventApplication/operation/detail";
import {
  AppRouterInstance
} from "next/dist/shared/lib/app-router-context.shared-runtime";

type EventApplicationWithPermission = [
  number, // uuid
  string, // applicant
  string, // society
  string, // venue
  [ string, string ], // timeRange
  string, // title
  string, // description
  boolean, // isActive
  number, // capacity
  string, // status
  string, // message
  string[]
]

interface EventApplicationRowProps {
  anchorEl: HTMLElement | null;
  selectedRow: number | null;
  selectedOption: string | null;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, rowId: number) => void;
  handleMenuClose: () => void;
  handleMenuSelect: (uuid: number, option: string) => void;
  handleDialogClose: () => void;
}

function EventApplicationRow(router: AppRouterInstance, onSuccess: () => void, item: EventApplicationWithPermission, props: EventApplicationRowProps) {
  const uuid = item[0];
  const applicant = item[1];
  const society = item[2];
  const venue = item[3];
  const startTime = item[4][0];
  const endTime = item[4][1];
  const title = item[5];
  const isActive = item[7];
  const capacity = item[8];
  const status = item[9];
  const permission = item[11];

  return (<TableRow
          key = { uuid }
          sx = { {
            height: "6%",
            verticalAlign: "top"
          } }
  >
    <TableCell
            sx = { {
              width: "20%"
            } }
    >
      <Typography>
        { uuid }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { title }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { applicant }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { isActive ? "有效" : "无效" }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { society }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { venue }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { new Date(startTime).toLocaleString("zh-Hans-CN") }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { new Date(endTime).toLocaleString("zh-Hans-CN") }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { {
          "approved": "已通过",
          "rejected": "已拒绝",
          "pending": "待审核"
        }[status] }
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
          isActive ?
                  (<MenuItem
                          onClick = { () => {
                            props.handleMenuClose();
                            props.handleDialogClose();
                            fetch("/api/console/eventParticipation/place", {
                              method: "POST",
                              body: JSON.stringify({ applyingEvent: uuid })
                            }).then(
                                    res => {
                                      if (!res.ok) {
                                        res.json().then(
                                                error => {
                                                  alert("申请失败。错误代码：" + error.error);
                                                }
                                        );
                                        return;
                                      }
                                      alert("申请成功");
                                      onSuccess();
                                    }
                            );
                          } }
                  >
                    <Typography>申请参加</Typography>
                  </MenuItem>) : null
        }
        {
          isActive &&
          permission.length ? (<MenuItem
                  onClick = { () => {
                    props.handleMenuClose();
                    props.handleDialogClose();
                    fetch("/api/console/eventApplication/cancel", {
                      method: "POST",
                      body: JSON.stringify({ uuid })
                    }).then(
                            res => {
                              if (!res.ok) {
                                res.json().then(
                                        error => {
                                          alert("撤销失败。错误代码：" + error.error);
                                        }
                                );
                                return;
                              }
                              alert("撤销成功");
                              onSuccess();
                            }
                    );
                  } }
          >
            <Typography>撤销</Typography>
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
  const [ data, setData ] = useState<EventApplicationWithPermission[] | null>(null);
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
      let filterSocieties = null;
      let filterTimeRange = null;
      let filterStatus = null;
      let filterActive = null;
      if (filter.page?.[0] === "eventApplication") {
        filterSocieties = filter.societyId?.length ? filter.societyId : null;
        filterTimeRange = filter.timeRange?.length ? filter.timeRange : null;
        filterStatus = filter.status?.length ? filter.status : null;
        filterActive = filter.active?.length ? true : null;
      } else if (filter.page) {
        consoleState.filter.set({});
      }
      const response = await fetch("/api/console/eventApplication/list", {
        method: "POST",
        body: JSON.stringify({
          filterStatus,
          filterSocieties,
          filterOrganisations: null,
          filterOrganisationHierarchy: null,
          filterVenues: null,
          filterTimeRange,
          filterApplicants: null,
          filterSelf: null,
          filterActive
        })
      });
      if (!response.ok) {
        alert("获取信息失败。错误代码：" + (await response.json()).error);
        return;
      }
      const data = await response.json();

      const fetches = [];
      for (const society of data.payload) {
        const res1 = fetch("/api/console/eventApplication/getPermission", {
          method: "POST",
          body: JSON.stringify({ uuid: society[0] })
        });
        fetches.push(res1);
      }

      const results = await Promise.all(fetches);

      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (!res.ok) {
          alert("获取信息失败。错误代码：" + (await res.json()).error);
          return;
        }
        const permission = await res.json();
        data.payload[i].push(permission.payload);
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
  }, [ consoleState.filter, dispatch, fetching, init, router ]);

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

  const eventApplicationViewProps: EventApplicationRowProps = {
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
            <ViewEventApplicationDialog row = { selectedRow } option = { selectedOption }
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
                            width: "20%"
                          } }
                  >
                    <Typography>
                      活动Id
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      活动名称
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      申请人
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      是否有效
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      社团
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      场地
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      开始时间
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      结束时间
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      状态
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
                        data && data.map(item => EventApplicationRow(router, onSuccess, item, eventApplicationViewProps))
                }
              </TableBody>
            </Table>
          </Box>
  );
}