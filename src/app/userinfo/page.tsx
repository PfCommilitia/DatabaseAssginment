"use client";

import { getSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/dependencies/redux/store";
import { setSession } from "@/app/dependencies/redux/stateSlices/session";
import { useEffect } from "react";

function ContentSession(): JSX.Element {
  const session = useSelector((state: RootState) => state.session.session);
  if (!session) {
    // TODO: Replace this with a page with a button that redirects to the login page
    return (<>
      <h1>用户未登录</h1>
    </>);
  }
  // TODO: Replace this with actual console page
  return (<></>);
}

export default function UserInfo() {
  const dispatch = useDispatch();
  const session = useSelector((state: RootState) => state.session.session);

  useEffect(() => {
    async function setSessionIfMissing() {
      if (!session) {
        const currentSession = await getSession();
        if (currentSession) {
          dispatch(setSession(currentSession));
        }
      }
    }

    setSessionIfMissing();
  }, [ session, dispatch ]);

  return (<ContentSession></ContentSession>);
}
