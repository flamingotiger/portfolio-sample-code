import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  CategoryFieldsType,
  ItemFieldsType,
  RecordType,
} from "lib/types/airtable";
import type { RootState } from "../..";

interface CategoryState {
  highCategories: RecordType<CategoryFieldsType>[];
  middleCategories: RecordType<CategoryFieldsType>[];
  lowCategories: RecordType<CategoryFieldsType>[];
  selectedHighCategory: RecordType<CategoryFieldsType> | null;
  selectedMiddleCategory: RecordType<CategoryFieldsType> | null;
  selectedLowCategory: RecordType<CategoryFieldsType> | null;
  searchValue: string;
  selectedItemIds: string[];
  adderItems: RecordType<ItemFieldsType>[];
  managerItems: RecordType<ItemFieldsType>[];
}

const initialState: CategoryState = {
  highCategories: [],
  middleCategories: [],
  lowCategories: [],
  selectedHighCategory: null,
  selectedMiddleCategory: null,
  selectedLowCategory: null,
  searchValue: "",
  selectedItemIds: [],
  adderItems: [],
  managerItems: [],
};

export const slice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setCategories: (
      state,
      {
        payload,
      }: PayloadAction<{
        categories: RecordType<CategoryFieldsType>[];
        type: string;
      }>
    ) => {
      switch (payload.type) {
        case "HIGH":
          state.highCategories = payload.categories;
          break;
        case "MIDDLE":
          state.middleCategories = payload.categories;
          break;
        case "LOW":
          state.lowCategories = payload.categories;
          break;
        default:
          break;
      }
    },
    addCategory: (
      state,
      {
        payload,
      }: PayloadAction<{
        category: RecordType<CategoryFieldsType>;
        type: string;
      }>
    ) => {
      switch (payload.type) {
        case "HIGH":
          state.highCategories = [...state.highCategories, payload.category];
          break;
        case "MIDDLE":
          state.middleCategories = [
            ...state.middleCategories,
            payload.category,
          ];
          break;
        case "LOW":
          state.lowCategories = [...state.lowCategories, payload.category];
          break;
        default:
          break;
      }
    },
    updateCategory: (
      state,
      {
        payload,
      }: PayloadAction<{
        category: RecordType<CategoryFieldsType>;
        type: string;
        name: string;
      }>
    ) => {
      switch (payload.type) {
        case "HIGH":
          state.highCategories = state.highCategories.map((category) => {
            if (category.id === payload.category.id) {
              return {
                ...category,
                fields: { ...category.fields, name: payload.name },
              };
            }
            return category;
          });
          break;
        case "MIDDLE":
          state.middleCategories = state.middleCategories.map((category) => {
            if (category.id === payload.category.id) {
              return {
                ...category,
                fields: { ...category.fields, name: payload.name },
              };
            }
            return category;
          });
          break;
        case "LOW":
          state.lowCategories = state.lowCategories.map((category) => {
            if (category.id === payload.category.id) {
              return {
                ...category,
                fields: { ...category.fields, name: payload.name },
              };
            }
            return category;
          });
          break;
        default:
          break;
      }
    },
    selectCategory: (
      state,
      {
        payload,
      }: PayloadAction<{
        category: RecordType<CategoryFieldsType>;
        type: string;
      }>
    ) => {
      state.managerItems = [];
      switch (payload.type) {
        case "HIGH":
          state.selectedHighCategory = payload.category;
          state.selectedMiddleCategory = null;
          state.selectedLowCategory = null;
          state.middleCategories = [];
          state.lowCategories = [];
          break;
        case "MIDDLE":
          state.selectedMiddleCategory = payload.category;
          state.selectedLowCategory = null;
          state.lowCategories = [];
          break;
        case "LOW":
          state.selectedLowCategory = payload.category;
          break;
        default:
          break;
      }
    },
    deleteCategory: (
      state,
      {
        payload,
      }: PayloadAction<{
        category: RecordType<CategoryFieldsType>;
        type: string;
      }>
    ) => {
      switch (payload.type) {
        case "HIGH":
          state.highCategories = state.highCategories.filter(
            (category) => category.id !== payload.category.id
          );
          if (payload.category.id === state.selectedHighCategory?.id) {
            state.selectedHighCategory = null;
            state.selectedMiddleCategory = null;
            state.selectedLowCategory = null;
          }
          break;
        case "MIDDLE":
          state.middleCategories = state.middleCategories.filter(
            (category) => category.id !== payload.category.id
          );
          if (payload.category.id === state.selectedMiddleCategory?.id) {
            state.selectedMiddleCategory = null;
            state.selectedLowCategory = null;
          }
          break;
        case "LOW":
          state.lowCategories = state.lowCategories.filter(
            (category) => category.id !== payload.category.id
          );
          if (payload.category.id === state.selectedLowCategory?.id) {
            state.selectedLowCategory = null;
          }
          break;
        default:
          break;
      }
    },
    setSearchValue: (state, { payload }: PayloadAction<string>) => {
      state.searchValue = payload;
    },
    selectItemId: (state, { payload }: PayloadAction<string>) => {
      const hasItemId = state.selectedItemIds.some(
        (selectedItemId) => selectedItemId === payload
      );
      if (hasItemId) {
        state.selectedItemIds = state.selectedItemIds.filter(
          (selectedItemId) => selectedItemId !== payload
        );
      } else {
        state.selectedItemIds = [...state.selectedItemIds, payload];
      }
    },
    resetAdder: (state) => {
      state.adderItems = [];
      state.selectedItemIds = [];
    },
    resetManager: (state) => {
      state.managerItems = [];
    },
    addAdderItems: (
      state,
      { payload }: PayloadAction<RecordType<ItemFieldsType>[]>
    ) => {
      state.adderItems = [...state.adderItems, ...payload];
    },
    addManagerItems: (
      state,
      { payload }: PayloadAction<RecordType<ItemFieldsType>[]>
    ) => {
      state.managerItems = [...state.managerItems, ...payload];
    },
  },
});

export const categoryReducer = slice.reducer;
export const categoryActions = slice.actions;

export const categorySelector = (state: RootState) => state.category;

export default slice.reducer;
