import { PayloadAction } from "@reduxjs/toolkit";
import { GenericResponseAction, IndexKey } from "lib/default";

type EditFieldPayload = { field: string; value: any };

/**
 *  InitalState type declare
 *  기본 상태 타입 정의
 */
export type WriteCommonPageLogicState<P> = {
  data: P & { _id?: string };
  changed: boolean;
  tabs: (P & { _id: string; changed: boolean })[];
};

/**
 *  Delete common creation fixes and manage tabs on each page
 *  각 페이지의 공통 작성 수정사항 삭제 및 리스트 탭 상태 관리
 *
 * @param initialState -- Each reducer initialState (storage.ts - initialState) // 각각의 리듀서에서 기본상태를 함수 파라미터로 보내줘야함
 */
export default function writeCommonPageLogic<
  S extends WriteCommonPageLogicState<P>,
  P
>(initialState: S) {
  const reducers = {
    // Common write logic
    getById: (
      state: S,
      { payload }: PayloadAction<GenericResponseAction<any>>
    ) => {
      const { data } = payload;
      state.data = data;
    },
    editField: (state: S, { payload }: PayloadAction<EditFieldPayload>) => {
      const { field, value } = payload;
      const { data } = state;
      // Example field name ex) fruit.red.apple
      const splitField = field.split(".");
      if (splitField.length === 2) {
        const [shallow, deep] = splitField;
        (data as IndexKey<any>)[shallow][deep] = value;
      } else if (splitField.length === 3) {
        const [shallow, deep, deps] = splitField;
        (data as IndexKey<any>)[shallow][deep][deps] = value;
      } else if (splitField.length === 4) {
        const [shallow, deep, deep1, deep2] = splitField;
        (data as IndexKey<any>)[shallow][deep][deep1][deep2] = value;
      } else {
        (data as IndexKey<any>)[field] = value;
      }

      state.data = data;
      state.changed = true;
    },
    keepIdReset: (state: S) => {
      if (state.data._id) {
        state.data = { ...initialState.data, _id: state.data._id };
      } else {
        state.data = initialState.data;
      }
      state.changed = false;
    },
    reset: (state: S) => {
      state.data = initialState.data;
      state.changed = false;
    },
    write: (state: S) => {
      state.changed = true;
    },
    // List tab logic
    insertTab: (state: S, { payload }: PayloadAction<{ data: any }>) => {
      const { data } = payload;
      const findData = state.tabs.some((tab) => tab._id === data._id);
      if (!findData) {
        state.tabs.push({ ...data, changed: !!data.changed });
      }
    },
    updateTab: (state: S, { payload }: PayloadAction<{ data: any }>) => {
      const { data } = payload;
      const findIndex = state.tabs.findIndex((tab) => tab._id === data._id);
      if (findIndex >= 0) {
        state.tabs[findIndex] = { ...data, changed: false };
      } else {
        state.tabs.push({ ...data, changed: false });
      }
    },
    removeTab: (state: S, { payload }: PayloadAction<{ id: string }>) => {
      const { id } = payload;
      state.tabs = state.tabs.filter((tab) => tab._id !== id);
    },
    removeAllTab: (state: S) => {
      state.tabs = [];
      state.data = initialState.data;
      state.changed = false;
    },
    modifyTabStatus: (state: S, { payload }: PayloadAction<{ id: string }>) => {
      const { id } = payload;
      const findIndex = state.tabs.findIndex((tab) => tab._id === id);
      state.tabs[findIndex] = { ...state.tabs[findIndex], changed: true };
    },
  };
  return reducers;
}
