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
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import {
  AppRouterInstance
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import ViewEventParticipationDialog
  from "@/app/console/eventParticipation/operation/detail";

type EventParticipationWithPermission = [
  string, // uuid
  string, // applicant
  string, // society
  string, // venue
  string, // organiser
  [ string, string ], // timeRange
  string, // applicationTime
  string, // title
  string, // description
  boolean, // isActive
  string, // status
  string, // participationStatus
  string[]
]

interface EventParticipationRowProps {
  anchorEl: HTMLElement | null;
  selectedRow: string | null;
  selectedOption: string | null;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, rowId: string) => void;
  handleMenuClose: () => void;
  handleMenuSelect: (uuid: string, option: string) => void;
  handleDialogClose: () => void;
}

function EventParticipationRow(router: AppRouterInstance, onSuccess: () => void, item: EventParticipationWithPermission, props: EventParticipationRowProps) {
  const uuid = item[0];
  const applyingEvent = item[1];
  const applicant = item[2];
  const isActive = item[10];
  const status = item[11];
  const permission = item[12];

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
              width: "20%"
            } }
    >
      <Typography>
        { applyingEvent }
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
        { {
          "approved": "已通过",
          "rejected": "已拒绝",
          "pending": "待审核"
        }[status] }
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
          permission.length ? (<MenuItem
                  onClick = { () => {
                    props.handleMenuClose();
                    props.handleDialogClose();
                    fetch("/api/console/eventParticipation/cancel", {
                      method: "POST",
                      body: JSON.stringify({ uuid })
                    }).then(
                            res => {
                              if (!res.ok) {
                                res.json().then(
                                        error => {
                                          if (error && error.error) {
                                            router.push(`/error?error=${ encodeURIComponent(error.error) }`);
                                          } else {
                                            router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
                                          }
                                        }
                                ).catch(() => {
                                  router.push(`/error?error=${ encodeURIComponent(ERROR_UNKNOWN.code) }`);
                                });
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
  const [ data, setData ] = useState<EventParticipationWithPermission[] | null>(null);
  const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);
  const [ selectedOption, setSelectedOption ] = useState<string | null>(null);
  const [ selectedRow, setSelectedRow ] = useState<string | null>(null);
  const [ init, setInit ] = useState<boolean>(false);
  const dispatch = useDispatch();
  const fetching = useSelector((state: RootState) => state.session.fetching);
  const router = useRouter();

  useEffect(() => {
    const filter = consoleState.filter.get();
    let filterParticipationStatus: string[] | null = null;
    let filterEvents: string[] | null = null;
    let filterApplicantSocieties: string[] | null = null;
    let filterApplicantOrganisationHierarchy: string[] | null = null;
    let filterApplicants: string[] | null = null;
    let filterStatus: string[] | null = null;
    let filterActive: boolean | null = null;
    if (filter.page?.[0] === "eventParticipation") {
      filterParticipationStatus = filter.status?.length ? filter.status : null;
      filterEvents = filter.eventId?.length ? filter.eventId : null;
      filterApplicantSocieties = filter.applicantSocietyId?.length ? filter.applicantSocietyId : null;
      filterApplicantOrganisationHierarchy = filter.applicantOrganisationId?.length ? filter.applicantOrganisationId : null;
      filterApplicants = filter.applicant?.length ? filter.applicant : null;
      filterStatus = filter.eventStatus?.length ? filter.eventStatus : null;
      filterActive = filter.filterActive?.length ? true : null;
    } else {
      consoleState.filter.set({});
    }

    async function fetchData() {
      const response = await fetch("/api/console/eventParticipation/list", {
        method: "POST",
        body: JSON.stringify({
          filterStatus,
          filterParticipationStatus,
          filterEvents,
          filterSocieties: null,
          filterOrganisations: null,
          filterOrganisationHierarchy: null,
          filterOrganisers: null,
          filterVenues: null,
          filterTimeRange: null,
          filterApplicationTimeRange: null,
          filterApplicantSocieties,
          filterApplicantOrganisationHierarchy,
          filterApplicants,
          filterSelf: null,
          filterActive
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

      for (const society of data.payload) {
        const res1 = await fetch("/api/console/Participation/getPermission", {
          method: "POST",
          body: JSON.stringify({ uuid: society[0] })
        });
        const permission = (await res1.json()).payload;
        society.push(permission);
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

  function handleMenuOpen(event: React.MouseEvent<HTMLElement>, rowId: string) {
    setAnchorEl(event.currentTarget);
    setSelectedRow(rowId);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function handleMenuSelect(uuid: string, option: string) {
    setSelectedRow(uuid);
    setSelectedOption(option);
    handleMenuClose();
  }

  function handleDialogClose() {
    setSelectedRow(null);
    setSelectedOption(null);
  }

  const eventApplicationViewProps: EventParticipationRowProps = {
    anchorEl,
    selectedRow,
    selectedOption,
    handleMenuOpen,
    handleMenuClose,
    handleMenuSelect,
    handleDialogClose
  };

  function onSuccess() {
    dispatch(setFetching(true));
  }

  return (
          <Box
                  sx = { {
                    width: "100%",
                    height: "100%",
                    overflowX: "auto"
                  } }
          >
            <ViewEventParticipationDialog row = { selectedRow }
                                          option = { selectedOption }
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
                      申请Id
                    </Typography>
                  </TableCell>
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
                      状态
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
                        data && data.map(item => EventParticipationRow(router, onSuccess, item, eventApplicationViewProps))
                }
              </TableBody>
            </Table>
          </Box>
  );
}