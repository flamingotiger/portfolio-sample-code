import { Checkbox } from "components/common/Checkbox";
import DeleteDialog from "components/Dialogs/PageDialog/DeleteDialog";
import { isToday, isYesterday } from "date-fns";
import useAuthority from "hooks/useAuthority";
import useI18next from "hooks/useI18next";
import useTimezone from "hooks/useTimezone";
import { EmployeeApi, LogApi } from "lib/api/API";
import { SKIP } from "lib/constants";
import { IndexKey } from "lib/default";
import { nameFieldText, randomId } from "lib/utils";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dialogAction, DialogKey } from "store/reducers/dialog";
import { profileAction, profileSelector } from "store/reducers/side/profile";
import { userSelector } from "store/reducers/user";
import styled from "styled-components";
import PageNavigation from "../components/PageNavigation";
import { ProfileStyle } from "../components/profile.style";
import LogListHeader from "./components/LogListHeader";
import LogListTable from "./components/LogListTable";
import LogListTableDate from "./components/LogListTableDate";
import LogListTableHead from "./components/LogListTableHead";
import LogListTableRow from "./components/LogListTableRow";
import HistoryListTab from "./HistoryListTab";

const PageNavigationWrapper = styled.div`
  margin-top: 1.625rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const LIST_LIMIT = 15;
const ProfileWorkingContainer = () => {
  const { t } = useI18next();
  const dispatch = useDispatch();
  const { user } = useSelector(userSelector);
  const { selectedEmployeeIds, workLogs, isListFilter } =
    useSelector(profileSelector);
  const { timezoneFormat } = useTimezone();
  const { isMaster, userAuthority } = useAuthority();
  const [counts, setCounts] = useState(0);
  const [skip, setSkip] = useState(SKIP);

  const handleAllCheck = () => dispatch(profileAction.onSelectAllWorkingLogs());
  const handleCheck = (id: string) =>
    dispatch(profileAction.onSelectWorkLog({ id }));
  const handlePageNavigation = (pageSkip: number) => setSkip(pageSkip);

  useEffect(() => {
    if (
      isMaster ||
      (userAuthority?.employee.access && userAuthority?.employee.edit)
    ) {
      (async () => {
        const { employees } = await EmployeeApi.listLogs();
        dispatch(profileAction.setEmployees({ employees }));
      })();
    }
  }, [dispatch, isMaster, userAuthority]);

  const countWorkLog = useCallback(async () => {
    const isAdmin =
      isMaster ||
      (userAuthority?.employee.access && userAuthority?.employee.edit);
    const query: IndexKey<string | number> = {
      worker: isAdmin ? selectedEmployeeIds.join(",") : (user?._id as string),
    };
    try {
      const resCount = await LogApi.countsWork(query);
      setCounts(resCount.counts);
    } catch (error) {
      console.log(error);
    }
  }, [selectedEmployeeIds, isMaster, user, userAuthority]);

  useEffect(() => {
    countWorkLog();
  }, [countWorkLog]);

  const listWorkingLogs = useCallback(async () => {
    const isAdmin =
      isMaster ||
      (userAuthority?.employee.access && userAuthority?.employee.edit);
    // master 계정 : 일반 유저
    const query: IndexKey<string | number> = {
      skip,
      limit: LIST_LIMIT,
      sort: "-createdAt",
      worker: isAdmin ? selectedEmployeeIds.join(",") : (user?._id as string),
    };
    try {
      const list = await LogApi.listWork(query);
      dispatch(profileAction.setWorkLogs({ workLogs: list.workLogs }));
    } catch (error) {
      console.log(error);
    }
  }, [dispatch, isMaster, selectedEmployeeIds, skip, user, userAuthority]);

  useEffect(() => {
    listWorkingLogs();
  }, [listWorkingLogs]);

  const handleRemove = () => {
    const hasSelectWorkLogs = workLogs.filter((workLog) => workLog.isSelect);
    const workLogIds = hasSelectWorkLogs
      .map((workLog) => workLog._id)
      .join(",");
    if (hasSelectWorkLogs.length > 0) {
      dispatch(
        dialogAction.customOpen({
          key: DialogKey.delete,
          dialog: (
            <DeleteDialog
              onDelete={() => {
                (async () => {
                  try {
                    const success = await LogApi.deleteWorks({
                      ids: workLogIds,
                    });
                    // 남은 로그 전부 선택해서 삭제시 (전체 및 남은 로그 전체)
                    if (success.workLogs === workLogs.length) {
                      // skip을 LIST_LIMIT만큼 이동
                      setSkip((prevSkip) => {
                        if (prevSkip <= 0) return 0;
                        return prevSkip - LIST_LIMIT;
                      });
                    }
                    // workinglogs 불러오기
                    listWorkingLogs();
                    // count 갯수 불러오기
                    countWorkLog();
                  } catch (error) {
                    console.log(error);
                  }
                })();
              }}
            />
          ),
        })
      );
    }
  };

  const isCheckedAll =
    workLogs.length > 0 && workLogs.every((workLog) => workLog.isSelect);
  const widths = [
    "3.125rem",
    "7.8125rem",
    "7.8125rem",
    "9.375rem",
    "9.375rem",
    "9.375rem",
  ];
  return (
    <ProfileStyle.Wrapper>
      <ProfileStyle.ListLeft>
        <HistoryListTab />
      </ProfileStyle.ListLeft>
      <ProfileStyle.ListRight>
        <LogListHeader onRemove={handleRemove} />
        {isListFilter && <ProfileStyle.Blur />}
        <ProfileStyle.TableWrapper>
          <LogListTable>
            <colgroup>
              {widths.map((width) => (
                <col width={width} key={randomId()} />
              ))}
            </colgroup>
            <thead>
              <LogListTableRow noBorder isNew>
                <LogListTableHead width={widths[0]}>
                  <Checkbox
                    id="all"
                    onChange={handleAllCheck}
                    checked={isCheckedAll}
                  />
                </LogListTableHead>
                <LogListTableHead width={widths[1]}>
                  {t("profile.date")}
                </LogListTableHead>
                <LogListTableHead width={widths[2]}>
                  {t("profile.time")}
                </LogListTableHead>
                <LogListTableHead width={widths[3]} color="mintdark">
                  {t("profile.action")}
                </LogListTableHead>
                <LogListTableHead width={widths[4]} color="mintdark">
                  {t("profile.employee")}
                </LogListTableHead>
                <LogListTableHead width={widths[5]} color="mintdark">
                  {t("profile.profession")}
                </LogListTableHead>
              </LogListTableRow>
            </thead>
            <tbody>
              {workLogs.map((workLog) => {
                // 1일까지만 새로작성된글
                const isNew =
                  workLog.createdAt &&
                  (isToday(new Date(workLog.createdAt)) ||
                    isYesterday(new Date(workLog.createdAt)));
                return (
                  <LogListTableRow key={workLog._id} isNew={!!isNew}>
                    <LogListTableDate width={widths[0]}>
                      <Checkbox
                        id={randomId()}
                        onChange={() => handleCheck(workLog._id as string)}
                        checked={workLog.isSelect}
                      />
                    </LogListTableDate>
                    <LogListTableDate width={widths[1]}>
                      {workLog.createdAt &&
                        timezoneFormat(workLog.createdAt, "yyyy/MM/dd")}
                    </LogListTableDate>
                    <LogListTableDate width={widths[2]}>
                      {workLog.createdAt &&
                        timezoneFormat(workLog.createdAt, "HH:mm")}
                    </LogListTableDate>
                    <LogListTableDate width={widths[3]}>
                      {workLog.action}
                    </LogListTableDate>
                    <LogListTableDate width={widths[4]}>
                      {nameFieldText(
                        workLog.worker?.firstName,
                        workLog.worker?.lastName
                      )}
                    </LogListTableDate>
                    <LogListTableDate width={widths[5]}>
                      {workLog.worker.professions[0] &&
                        workLog.worker.professions[0].title}
                    </LogListTableDate>
                  </LogListTableRow>
                );
              })}
            </tbody>
          </LogListTable>
        </ProfileStyle.TableWrapper>
        <PageNavigationWrapper>
          <PageNavigation
            count={counts}
            skip={skip}
            limit={LIST_LIMIT}
            onPageNation={handlePageNavigation}
          />
        </PageNavigationWrapper>
      </ProfileStyle.ListRight>
    </ProfileStyle.Wrapper>
  );
};

export default ProfileWorkingContainer;
