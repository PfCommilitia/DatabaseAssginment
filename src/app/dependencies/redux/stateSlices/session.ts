import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Session } from "next-auth";

interface SessionState {
  session: Session | null;
  fetching: boolean;
}

const initialState: SessionState = {
  session: null,
  fetching: false
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
    },
    setFetching: (state, action: PayloadAction<boolean>) => {
      state.fetching = action.payload;
    }
  }
});

export const { setSession, setFetching } = sessionSlice.actions;
export default sessionSlice.reducer;