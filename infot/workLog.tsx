import { LogApi } from "lib/api/API";
import { SIDE_ROUTE_NAMES } from "lib/constants";
import { IndexKey } from "lib/default";
import { nameFieldText, randomId } from "lib/utils";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { profileAction, profileSelector } from "store/reducers/side/profile";
import { userSelector } from "store/reducers/user";
import styled from "styled-components";
import useAuthority from "hooks/useAuthority";
import useI18next from "hooks/useI18next";
import LogSectionTitle from "../log/LogSectionTitle";
import LogItem from "../log/LogItem";

const HistoryWrapperButton = styled.button`
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  width: 100%;
  max-width: 40.875rem;
`;
type WorkingHistoryProps = {
  type: "main" | "list";
};
const WorkingHistory: React.FC<WorkingHistoryProps> = ({ type }) => {
  const { t } = useI18next();
  const dispatch = useDispatch();
  const { user } = useSelector(userSelector);
  const { isMaster, userAuthority } = useAuthority();
  const { selectedEmployeeIds, previewLog } = useSelector(profileSelector);
  const [counts, setCounts] = useState(0);

  useEffect(() => {
    const listWorkLog = async () => {
      let query: IndexKey<string | number> = {
        skip: 0,
        limit: 3,
        sort: "-createdAt",
      };
      const isAdmin =
        isMaster ||
        (userAuthority?.employee.access && userAuthority?.employee.edit);
      if (isAdmin) {
        // master 계정
        query = {
          ...query,
          worker: selectedEmployeeIds.join(","),
        };
      } else {
        // 일반 유저
        query = {
          ...query,
          worker: user?._id as string,
        };
      }
      try {
        const { workLogs } = await LogApi.listWork(query);
        if (isAdmin) {
          dispatch(
            profileAction.setPreviewWork({
              workLogs: selectedEmployeeIds.length > 0 ? workLogs : [],
            })
          );
        } else {
          dispatch(profileAction.setPreviewWork({ workLogs }));
        }
      } catch (error) {
        console.log(error);
      }
    };
    listWorkLog();

    const getCounts = async () => {
      try {
        const count = await LogApi.countsWork({
          isNew: true,
          worker: selectedEmployeeIds.join(","),
        });
        setCounts(count.counts);
      } catch (error) {
        console.log(error);
      }
    };
    if (selectedEmployeeIds.length > 0) {
      getCounts();
    }
  }, [dispatch, selectedEmployeeIds, isMaster, type, user, userAuthority]);

  return (
    <div>
      <LogSectionTitle
        title={`${t("profile.work")} ${t("profile.history")} (${counts})`}
      />
      <HistoryWrapperButton
        type="button"
        onClick={() =>
          dispatch(
            profileAction.go({ route: SIDE_ROUTE_NAMES.PROFILE_WORKING })
          )
        }
      >
        {previewLog.workLogs.slice(0, 3).map((workLog, index) => {
          return (
            <LogItem
              key={randomId()}
              log={{
                action: workLog.action,
                name: nameFieldText(
                  workLog.worker?.firstName,
                  workLog.worker?.lastName
                ),
                createdAt: workLog.createdAt,
                updatedAt: workLog.createdAt,
              }}
              isLast={index === 2}
            />
          );
        })}
        {previewLog.workLogs.length < 3 &&
          new Array(3 - previewLog.workLogs.length)
            .fill(null)
            .map((_, index) => (
              <LogItem
                key={randomId()}
                isLast={previewLog.workLogs.length + index + 1 === 3}
              />
            ))}
      </HistoryWrapperButton>
    </div>
  );
};

export default WorkingHistory;
