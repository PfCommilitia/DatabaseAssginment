import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setFetching, setSession } from "@/app/dependencies/redux/stateSlices/session";
import { getSession } from "next-auth/react";

export function useInitSession(): void {
  const dispatch = useDispatch();
  dispatch(setFetching(true));

  useEffect(() => {
    async function fetchSession() {
      const currentSession = await getSession();
      dispatch(setSession(currentSession));
      dispatch(setFetching(false));
    }

    fetchSession();
  }, [ dispatch ]);
}