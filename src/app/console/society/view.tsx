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
import { Society } from "@/app/dependencies/dataBackend/middleware/society/list";

function SocietyViewRow(item: Society) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ uuid, name, organisation, isActive, representative, _imageUrl, description ] = item;
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
        { isActive ? "活动" : "停止活动" }
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
              width: "50%"
            } }
    >
      <Typography>
        { description }
      </Typography>
    </TableCell>
  </TableRow>);
}

export default function View(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  const [ data, setData ] = useState<Society[] | null>(null);
  const [ init, setInit ] = useState<boolean>(false);
  const dispatch = useDispatch();
  const fetching = useSelector((state: RootState) => state.session.fetching);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const filter = consoleState.filter.get();
      let filterOrganisationHierarchy = null;
      let filterMember = null;
      if (filter.page?.[0] === "society") {
        filterOrganisationHierarchy = filter.organisationId?.length ? filter.organisationId : null;
        filterMember = filter.member?.length ? filter.member : null;
      } else {
        consoleState.filter.set({});
      }
      const response = await fetch("/api/console/society/list", {
        method: "POST",
        body: JSON.stringify({
          filterActive: null,
          filterRepresentatives: null,
          filterOrganisations: null,
          filterOrganisationHierarchy: filterOrganisationHierarchy,
          filterManaged: null,
          filterMember: filterMember
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
                      社团Id
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      社团名称
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
                      社团状态
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
                            width: "50%"
                          } }
                  >
                    <Typography>
                      描述
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
                        data && data.map(society => SocietyViewRow(society))
                }
              </TableBody>
            </Table>
          </Box>
  );
}