"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { NotLoggedIn } from "@/app/dependencies/sharedComponents/notLoggedIn";
import { Box } from "@mui/material";
import TopBar from "@/app/dependencies/sharedComponents/topBar";
import { useInitSession } from "@/app/dependencies/lib/initSession";

function ConsolePage(): JSX.Element {
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
                      width: "100%",
                      minHeight: "90vh",
                      maxHeight: "90vh"
                    } }
            ></Box>
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