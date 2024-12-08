"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { NotLoggedIn } from "@/app/dependencies/sharedComponents/notLoggedIn";
import { Box, Button, Typography } from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import { useInitSession } from "@/app/dependencies/lib/initSession";
import { Tab, ConsoleState } from "@/app/console/types";
import { useState } from "react";
import UserView from "@/app/console/user/view";
import UserControl from "@/app/console/user/control";
import SocietyView from "@/app/console/society/view";
import SocietyControl from "@/app/console/society/control";
import OrganisationView from "@/app/console/organisation/view";
import OrganisationControl from "@/app/console/organisation/control";
import VenueView from "@/app/console/venue/view";
import VenueControl from "@/app/console/venue/control";
import EventApplicationView from "@/app/console/eventApplication/view";
import EventApplicationControl from "@/app/console/eventApplication/control";
import EventParticipationView from "@/app/console/eventParticipation/view";
import EventParticipationControl from "@/app/console/eventParticipation/control";

function ConsoleMainView({ consoleState }: { consoleState: ConsoleState }): JSX.Element {
  if (consoleState.tab.get() === Tab.User) {
    return (<UserView
            consoleState = { consoleState }></UserView>);
  }
  if (consoleState.tab.get() === Tab.Organisation) {
    return (<OrganisationView
            consoleState = { consoleState }></OrganisationView>);
  }
  if (consoleState.tab.get() === Tab.Society) {
    return (<SocietyView
            consoleState = { consoleState }></SocietyView>);
  }
  if (consoleState.tab.get() === Tab.Venue) {
    return (<VenueView
            consoleState = { consoleState }></VenueView>);
  }
  if (consoleState.tab.get() === Tab.EventApplication) {
    return (<EventApplicationView
            consoleState = { consoleState }></EventApplicationView>);
  }
  if (consoleState.tab.get() === Tab.EventParticipation) {
    return (<EventParticipationView
            consoleState = { consoleState }></EventParticipationView>);
  }
  return (<></>);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ConsoleHorizontalControl({ consoleState }: {
  consoleState: ConsoleState
}): JSX.Element {
  if (consoleState.tab.get() === Tab.User) {
    return (<UserControl
            consoleState = { consoleState }></UserControl>);
  }
  if (consoleState.tab.get() === Tab.Organisation) {
    return (<OrganisationControl
            consoleState = { consoleState }></OrganisationControl>);
  }
  if (consoleState.tab.get() === Tab.Society) {
    return (<SocietyControl
            consoleState = { consoleState }></SocietyControl>);
  }
  if (consoleState.tab.get() === Tab.Venue) {
    return (<VenueControl
            consoleState = { consoleState }></VenueControl>);
  }
  if (consoleState.tab.get() === Tab.EventApplication) {
    return (<EventApplicationControl
            consoleState = { consoleState }></EventApplicationControl>);
  }
  if (consoleState.tab.get() === Tab.EventParticipation) {
    return (<EventParticipationControl
            consoleState = { consoleState }></EventParticipationControl>);
  }
  return (<></>);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ConsoleSidebar({ consoleState }: { consoleState: ConsoleState }): JSX.Element {
  function handleSetTab(newTab: Tab) {
    consoleState.tab.set(newTab);
    consoleState.filter.set({});
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
  const [ filter, setFilter ] = useState<Record<string, string[] | number[]>>({});
  const consoleState: ConsoleState = {
    tab: {
      get: () => tab,
      set: (newTab: Tab | null) => setTab(newTab)
    },
    filter: {
      get: () => filter,
      set: (newFilter: Record<string, string[] | number[]>) => setFilter(newFilter)
    }
  };

  return (
          <Box
                  sx = { {
                    alignItems: "center",
                    justifyItems: "center",
                    width: "100vw",
                    height: "100vh"
                  } }
          >
            <TopBar></TopBar>
            <Box
                    sx = { {
                      display: "flex",
                      width: "100%",
                      height: "90%"
                    } }
            >
              <Box
                      sx = { {
                        width: "10%",
                        height: "100%"
                      } }
              >
                <ConsoleSidebar consoleState = { consoleState }></ConsoleSidebar>
              </Box>
              <Box
                      sx = { {
                        display: "flex",
                        flexDirection: "column",
                        width: "90%",
                        height: "100%"
                      } }
              >
                <Box
                        sx = { {
                          width: "100%",
                          height: "15%"
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