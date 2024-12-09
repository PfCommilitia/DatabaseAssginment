import { ConsoleState } from "@/app/console/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Organisation
} from "@/app/dependencies/dataBackend/middleware/organisation/list";

function OrganisationViewRow(item: Organisation) {
  const [ uuid, name, representative, parent, isActive ] = item;
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
              width: "10%"
            } }
    >
      <Typography>
        { representative }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "20%"
            } }
    >
      <Typography>
        { parent }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        { isActive ? "活动" : "停止活动" }
      </Typography>
    </TableCell>
  </TableRow>);
}

export default function View(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  const [ data, setData ] = useState<Organisation[] | null>(null);
  const [ init, setInit ] = useState<boolean>(false);
  const dispatch = useDispatch();
  const fetching = useSelector((state: RootState) => state.session.fetching);
  const router = useRouter();
  
  useEffect(() => {
    async function fetchData() {
      const filter = consoleState.filter.get();
      let filterHierarchy = null;
      if (filter.page?.[0] === "organisation") {
        filterHierarchy = filter.organisationId?.length ? filter.organisationId : null;
      } else if (filter.page) {
        consoleState.filter.set({});
      }
      const response = await fetch("/api/console/organisation/list", {
        method: "POST",
        body: JSON.stringify({
          filterRepresentatives: null,
          filterHierarchy: filterHierarchy,
          filterParents: null,
          filterAncestors: null,
          filterManaged: null,
          filterActive: null
        })
      });
      if (!response.ok) {
        alert("获取信息失败。错误代码：" + (await response.json()).error);
        return;
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
  }, [ consoleState.filter, dispatch, fetching, init, router]);

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
                      组织Id
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "20%"
                          } }
                  >
                    <Typography>
                      组织名称
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      负责人
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "20%"
                          } }
                  >
                    <Typography>
                      上级组织
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      是否活动
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
                        data && data.map(society => OrganisationViewRow(society))
                }
              </TableBody>
            </Table>
          </Box>
  );
}
