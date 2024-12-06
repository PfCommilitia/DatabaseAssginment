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
import { Society } from "@/app/dependencies/dataBackend/middleware/society/list";

export function ListSocietiesHorizontalControl(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  return (<></>);
}

function SocietyViewRow([ uuid, name, organisation, isActive, representative, description ]:
                        Society): JSX.Element {
  return (<TableRow
          sx = { {
            height: "6%"
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
              width: "40%"
            } }
    >
      <Typography>
        { description }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "10%"
            } }
    >
      <Typography>
        操作
      </Typography>
    </TableCell>
  </TableRow>);
}

export function ListSocietiesView(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  const [ data, setData ] = useState<Society[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/console/society/list", {
        method: "POST",
        body: JSON.stringify({
          filterActive: null,
          filterRepresentatives: null,
          filterOrganisations: null,
          filterOrganisationHierarchy: null,
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
      setData(data.payload);
    }

    fetchData();
  }, [ router ]);

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
                            width: "40%"
                          } }
                  >
                    <Typography>
                      描述
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "10%"
                          } }
                  >
                    <Typography>
                      操作
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody
                      sx = { {
                        height: "90%"
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