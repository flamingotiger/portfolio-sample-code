import { createSlice } from "@reduxjs/toolkit";
import normalCommonPageLogic, {
  normalCommonPageLogicState,
} from "store/common/normalCommonPageLogic";
import { Authority } from "lib/types/authority";
import { RootState } from ".";
import { initialState as employeeInitialState } from "./employee";

export type AuthorityState = normalCommonPageLogicState<Authority> & {};

const name = "AUTHORITY";

export const initialAlarm = { cycle: true, shop: true, workingHour: true };
const initialPermission = {
  access: false,
  edit: false,
  responsibility: false,
};
export const initialState: AuthorityState = {
  data: {
    agency: initialPermission,
    art: initialPermission,
    artist: initialPermission,
    auction: initialPermission,
    client: initialPermission,
    community: initialPermission,
    critic: initialPermission,
    employee: initialPermission,
    exhibition: initialPermission,
    outsourcing: initialPermission,
    program: initialPermission,
    research: initialPermission,
    storage: initialPermission,
    support: initialPermission,
    alarm: initialAlarm,
    language: "english",
    isPending: false,
    owner: employeeInitialState.data,
  },
  tabs: [],
};

const reducers = normalCommonPageLogic<AuthorityState, Authority>(initialState);
const slice = createSlice({
  name,
  initialState,
  reducers: {
    ...reducers,
  },
});

export const authorityName = slice.name;
export const authorityReducer = slice.reducer;
export const authorityAction = slice.actions;

export const authoritySelector = (state: RootState) => state.authority;

export default slice;
