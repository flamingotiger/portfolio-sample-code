/* eslint-disable no-console */
/* eslint-disable func-names */
import { ipcMain } from "electron";
import { ClipboardEventPayload } from "renderer/store/types/types";
import { IpcMainInvokeEvent } from "electron/main";
import fs from "fs";
import { CLIPBOARD_CONTROLLER } from "./clipboard.constants";
import { db } from "../../db/init";

ipcMain.handle(CLIPBOARD_CONTROLLER.GET_CLIPBOARDS, async () => {
  try {
    const dbPromise = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM clipboard ORDER BY id DESC", (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });

    // 데이터베이스에서 가져온 데이터 반환
    return dbPromise;
  } catch (error) {
    console.error(
      "클립보드 데이터를 가져오는 중에 오류가 발생했습니다.",
      error
    );
    throw error;
  }
});

ipcMain.handle(
  CLIPBOARD_CONTROLLER.FAVORITE_CLIPBOARD,
  async (event: IpcMainInvokeEvent, id: number, isFavorite: boolean) => {
    try {
      const sql = `
      UPDATE clipboard
      SET isFavorite = ?
      WHERE id = ?
    `;
      const dbPromise = await new Promise((resolve, reject) => {
        db.run(sql, [isFavorite, id], function (err: Error) {
          if (err) {
            reject(err);
            return;
          }
          const thisValue: any = this;
          resolve(thisValue.changes);
        });
      });

      if (dbPromise === 1) {
        // 업데이트가 성공한 경우
        console.log(
          `ID ${id}의 클립보드 데이터의 isFavorite 값을 업데이트했습니다.`
        );
        return true;
      }
      // 해당 ID의 데이터가 없는 경우
      console.log(`ID ${id}의 클립보드 데이터가 존재하지 않습니다.`);
      return false;
    } catch (error) {
      console.error(
        "클립보드 데이터를 업데이트하는 중에 오류가 발생했습니다.",
        error
      );
      throw error;
    }
  }
);

// ...
// ...
