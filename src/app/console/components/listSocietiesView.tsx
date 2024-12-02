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

type SocietyData = [ string, string ][];

export function ListSocietiesHorizontalControl(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  return (<></>);
}

function SocietyViewRow([ uuid, name ]: [ string, string ]): JSX.Element {
  return (<TableRow
          sx = { {
            minHeight: "5vh"
          } }
  >
    <TableCell
            sx = { {
              width: "45%"
            } }
    >
      <Typography>
        { uuid }
      </Typography>
    </TableCell>
    <TableCell
            sx = { {
              width: "45%"
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
    </TableCell>
  </TableRow>);
}

export function ListSocietiesView(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { consoleState }: { consoleState: ConsoleState }
): JSX.Element {
  const [ data, setData ] = useState<SocietyData | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/console/society/listJoined", {
        method: "POST"
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
                    minHeight: "90vh",
                    overflowX: "auto"
                  } }
          >
            <Table
                    sx = { {
                      width: "100%"
                    } }
            >
              <TableHead>
                <TableRow
                        sx = { {
                          minHeight: "5vh"
                        } }
                >
                  <TableCell
                          sx = { {
                            width: "45%"
                          } }
                  >
                    <Typography>
                      社团Id
                    </Typography>
                  </TableCell>
                  <TableCell
                          sx = { {
                            width: "45%"
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
                      操作
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                        data && data.map(society => SocietyViewRow(society))
                }
              </TableBody>
            </Table>
          </Box>
  );
}