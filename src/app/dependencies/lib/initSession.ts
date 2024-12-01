import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSession } from "@/app/dependencies/redux/stateSlices/session";
import { getSession } from "next-auth/react";

export function useInitSession(): void {
  const dispatch = useDispatch();
  useEffect(() => {
    async function fetchSession() {
      const currentSession = await getSession();
      dispatch(setSession(currentSession));
    }

    fetchSession();
  }, [ dispatch ]);
}