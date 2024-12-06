"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { NotLoggedIn } from "@/app/dependencies/sharedComponents/notLoggedIn";
import { Box, Button, Typography } from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import { useInitSession } from "@/app/dependencies/lib/initSession";
import { Tab, ConsoleState } from "@/app/console/types";
import { useState } from "react";
import { ListSocietiesView } from "@/app/console/components/listSocietiesView";

function ConsoleMainView({ consoleState }: { consoleState: ConsoleState }): JSX.Element {
  if (consoleState.tab.get() === Tab.Society) {
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
  function handleSetTab(newTab: Tab) {
    consoleState.tab.set(newTab);
  }

  return (<Box
          sx = { {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            overflowY: "auto"
          } }
  >
    <Button
            variant = { consoleState.tab.get() === Tab.User ? "contained" : "outlined" }
            onClick = { () => handleSetTab(Tab.User) }
    >
      <Typography>用户</Typography>
    </Button>
    <Button
            variant = { consoleState.tab.get() === Tab.Organisation ? "contained" : "outlined" }
            onClick = { () => handleSetTab(Tab.Organisation) }
    >
      <Typography>组织</Typography>
    </Button>
    <Button
            variant = { consoleState.tab.get() === Tab.Society ? "contained" : "outlined" }
            onClick = { () => handleSetTab(Tab.Society) }
    >
      <Typography>社团</Typography>
    </Button>
    <Button
            variant = { consoleState.tab.get() === Tab.Venue ? "contained" : "outlined" }
            onClick = { () => handleSetTab(Tab.Venue) }
    >
      <Typography>场地</Typography>
    </Button>
    <Button
            variant = { consoleState.tab.get() === Tab.SocietyApplication ? "contained" : "outlined" }
            onClick = { () => handleSetTab(Tab.SocietyApplication) }
    >
      <Typography>社团申请</Typography>
    </Button>
    <Button
            variant = { consoleState.tab.get() === Tab.EventApplication ? "contained" : "outlined" }
            onClick = { () => handleSetTab(Tab.EventApplication) }
    >
      <Typography>活动申请</Typography>
    </Button>
    <Button
            variant = { consoleState.tab.get() === Tab.EventParticipation ? "contained" : "outlined" }
            onClick = { () => handleSetTab(Tab.EventParticipation) }
    >
      <Typography>活动参与</Typography>
    </Button>
  </Box>);
}

function ConsolePage(): JSX.Element {
  const [ tab, setTab ] = useState<Tab | null>(null);
  const consoleState: ConsoleState = {
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
                    width: "100vw",
                    height: "100vh",
                  } }
          >
            <TopBar></TopBar>
            <Box
                    sx = { {
                      display: "flex",
                      width: "100%",
                      height: "90%",
                    } }
            >
              <Box
                      sx = { {
                        width: "10%",
                        height: "100%",
                      } }
              >
                <ConsoleSidebar consoleState = { consoleState }></ConsoleSidebar>
              </Box>
              <Box
                      sx = { {
                        display: "flex",
                        flexDirection: "column",
                        width: "90%",
                        height: "100%",
                      } }
              >
                <Box
                        sx = { {
                          width: "100%",
                          height: "15%",
                        } }
                >
                  <ConsoleHorizontalControl
                          consoleState = { consoleState }></ConsoleHorizontalControl>
                </Box>
                <Box
                        sx = { {
                          width: "100%",
                          height: "85%",
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