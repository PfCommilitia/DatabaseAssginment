"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { NotLoggedIn } from "@/app/dependencies/sharedComponents/notLoggedIn";
import { Box } from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import { useInitSession } from "@/app/dependencies/lib/initSession";
import { TabGroup, Tab, ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { ListSocietiesView } from "@/app/console/components/listSocietiesView";

function ConsoleMainView({ consoleState }: { consoleState: ConsoleState }): JSX.Element {
  if (consoleState.tab.get() === Tab.ListSocietiesView) {
    return (<ListSocietiesView consoleState = { consoleState }></ListSocietiesView>);
  }
  return (<></>);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ConsoleHorizontalControl({ consoleState }: {
  consoleState: ConsoleState
}): JSX.Element {
  return (<></>);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ConsoleSidebar({ consoleState }: { consoleState: ConsoleState }): JSX.Element {
  return (<></>);
}

function ConsolePage(): JSX.Element {
  const [ expandedGroups, setExpandedGroups ] = useState<TabGroup[]>([]);
  const [ tab, setTab ] = useState<Tab | null>(Tab.ListSocietiesView);
  const consoleState: ConsoleState = {
    expandedGroups: {
      get: () => expandedGroups,
      set: (newExpandedGroups: TabGroup[]) => setExpandedGroups(newExpandedGroups)
    },
    tab: {
      get: () => tab,
      set: (newTab: Tab | null) => setTab(newTab)
    }
  };

  return (
          <Box
                  sx = { {
                    alignItems: "center",
                    justifyItems: "center",
                    width: "100%",
                    minHeight: "100vh",
                    maxHeight: "100vh"
                  } }
          >
            <TopBar></TopBar>
            <Box
                    sx = { {
                      display: "flex",
                      width: "100%",
                      minHeight: "90vh",
                      maxHeight: "90vh"
                    } }
            >
              <Box
                      sx = { {
                        width: "10%",
                        minHeight: "90vh",
                        maxHeight: "90vh"
                      } }
              >
                <ConsoleSidebar consoleState = { consoleState }></ConsoleSidebar>
              </Box>
              <Box
                      sx = { {
                        display: "flex",
                        flexDirection: "column",
                        width: "90%",
                        minHeight: "90vh",
                        maxHeight: "90vh"
                      } }
              >
                <Box
                        sx = { {
                          width: "100%",
                          minHeight: "10vh",
                          maxHeight: "10vh"
                        } }
                >
                  <ConsoleHorizontalControl
                          consoleState = { consoleState }></ConsoleHorizontalControl>
                </Box>
                <Box
                        sx = { {
                          width: "100%",
                          minHeight: "80vh",
                          maxHeight: "80vh",
                          overflowY: "auto",
                          boxSizing: "border-box"
                        } }
                >
                  <ConsoleMainView consoleState = { consoleState }></ConsoleMainView>
                </Box>
              </Box>
            </Box>
          </Box>
  );
}

function ContentSession(): JSX.Element {
  const session = useSelector((state: RootState) => state.session.session);
  if (!session) {
    return (<NotLoggedIn></NotLoggedIn>);
  }
  return (<ConsolePage></ConsolePage>);
}

export default function Console() {
  useInitSession();

  return (<ContentSession></ContentSession>);
}