import { ConsoleState } from "@/app/console/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { setFetching } from "@/app/dependencies/redux/stateSlices/session";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { User } from "@/app/dependencies/dataBackend/middleware/user/list";

function UserViewRow(item: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ username, name, isActive, isInitialized, organisation ] = item;
  return (<TableRow
          key = { username }
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
        { username }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { name }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
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
        { isActive ? "是" : "否" }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { isInitialized ? "是" : "否" }
      </Typography>
    </TableCell>
  </TableRow>);
}

export default function View(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  const [ data, setData ] = useState<User[] | null>(null);
  const [ init, setInit ] = useState<boolean>(false);
  const dispatch = useDispatch();
  const fetching = useSelector((state: RootState) => state.session.fetching);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const filter = consoleState.filter.get();
      let filterOrganisationHierarchy = null;
      let filterSocieties = null;
      let filterEvents = null;
      if (filter.page?.[0] === "user") {
        filterOrganisationHierarchy = filter.organisationId?.length ? filter.organisationId : null;
        filterSocieties = filter.societyId?.length ? filter.societyId : null;
        filterEvents = filter.eventId?.length ? filter.eventId : null;
      } else {
        consoleState.filter.set({});
      }
      const response = await fetch("/api/console/user/list", {
        method: "POST",
        body: JSON.stringify({
          filterOrganisations: null,
          filterOrganisationHierarchy: filterOrganisationHierarchy,
          filterSocieties: filterSocieties,
          filterActive: null,
          filterEvents: filterEvents
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

  return (
          <Box
                  sx = { {
                    width: "100%",
                    height: "100%",
                    overflowX: "auto"
                  } }
          >
            <Table
                    sx = { {
                      width: "100%",
                      height: "100%"
                    } }
            >
              <TableHead
                      sx = { {
                        height: "10%"
                      } }
              >
                <TableRow>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      学工号
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      姓名
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
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
                      是否在编
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      是否初始化
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody
                      sx = { {
                        height: "90%",
                        alignItems: "flex-start",
                        justifyItems: "flex-start"
                      } }
              >
                {
                        data && data.map(user => UserViewRow(user))
                }
              </TableBody>
            </Table>
          </Box>
  );
}
