import { ROUTE_NAMES } from "lib/constants";
import useI18next from "hooks/useI18next";
import React, { MouseEvent, useEffect } from "react";
import { useDispatch } from "react-redux";
import useWriteLocation from "hooks/useWriteLocation";
import { useHistory } from "react-router-dom";
import Icon from "components/common/Icon";
import useDialog from "hooks/useDialog";
import ListHistoryTab from "components/ListHistory/ListHistoryTab";
import { ListTabStyle } from "./ListTabStyle";
import ListTabItemList from "./ListTabItemList";

interface ListTabProps {
  type: string;
  action: any;
  state: any;
  title: string | string[];
  redirectUrl: ROUTE_NAMES;
  createUrl: string;
  updateUrl: string;
  isAddAuthority?: boolean;
}

/**
 * To the default configuration on the List tab
 * Get Redux's state and action to perform common tasks.
 * 상단의 목록 탭 기본 구성으로 일반 태스크를 수행하기 위한 Redux 상태 및 작업을 가져옵니다.
 *
 * @param type -- This page type (storage, artist..) // 섹션에 맞는 페이지 타입
 * @param action -- Redux each page action (storageAction, artistAction...) // 각 페이지에 해당하는 리덕스 액션
 * @param state -- Redux each page state (storage, artist...) // 각 페이지에 해당하는 리덕스 상태
 * @param title -- tab[key] Property key to be used as tab title // 탭 타이틀로 사용할 프로퍼티 키
 * @param redirectUrl -- Redirect each listpage url // 섹션에 맞는 리스트 페이지로 이동
 * @param createUrl -- Move link to create page // 생성 페이지로 이동
 * @param updateUrl -- Move link to update page // 업데이트 페이지로 이동
 * @param isAddAuthority -- Add authority // 생성 권한
 */

const ListTab: React.FC<ListTabProps> = ({
  type,
  action,
  state,
  redirectUrl,
  title,
  updateUrl,
  createUrl,
  isAddAuthority,
}) => {
  const { t, i18n } = useI18next();
  const history = useHistory();
  const dispatch = useDispatch();
  const { detailId } = useWriteLocation();
  const { data, tabs, changed }: { data: any; tabs: any[]; changed: boolean } =
    state;
  const { open } = useDialog();

  useEffect(() => {
    if (detailId === "write") {
      dispatch(action.write());
    }
  }, [action, dispatch, detailId]);

  const handleAllClose = () => {
    if (!tabs) return;
    if (!changed && tabs && tabs.length === 0) return;
    open({
      title:
        i18n.language === "en"
          ? "close all and quit?"
          : "모든 탭을 닫겠습니까?",
      buttonText: i18n.language === "en" ? "confirm" : "확인",
      onConfirm: () => {
        dispatch(action.removeAllTab());
        history.replace(redirectUrl);
      },
    });
  };

  const handleAdd = (e: MouseEvent) => {
    if (!changed) {
      dispatch(action.write());
      return;
    }

    e.preventDefault();

    open({
      title:
        i18n.language === "en"
          ? "a page in progress modification please complete it."
          : "작성 중 인 페이지가 있습니다. 작성 완료 바랍니다.",
      buttonText: i18n.language === "en" ? "confirm" : "확인",
      onConfirm: () => {
        const hasSomeChangingTab = tabs.some((tab) => tab.changed);
        history.push(hasSomeChangingTab ? updateUrl : createUrl);
      },
    });
  };

  const handleClose = (e: MouseEvent, tabId?: string) => {
    e.preventDefault();
    // 탭 id가 없으면서 작성중 (create)
    if (!tabId && changed) {
      open({
        title:
          i18n.language === "en"
            ? "close edit page and quit?"
            : "작성중인 탭을 닫겠습니까?",
        buttonText: i18n.language === "en" ? "confirm" : "확인",
        onConfirm: () => {
          dispatch(action.reset());
          history.replace(redirectUrl);
        },
      });
      return;
    }

    // 생성중이 아니면서 tabId가 있을때 (detail)
    if (tabId && !changed) {
      dispatch(action.removeTab({ id: tabId }));
      history.replace(redirectUrl);
      return;
    }

    // 작성 중 페이지의 아이디와 텝 아이디가 같을때 (modify)
    if (data._id === tabId && changed) {
      open({
        title:
          i18n.language === "en"
            ? "close edit page?"
            : "수정중인 탭을 닫겠습니까?",
        buttonText: i18n.language === "en" ? "confirm" : "확인",
        onConfirm: () => {
          dispatch(action.removeTab({ id: tabId }));
          dispatch(action.reset());
          history.replace(redirectUrl);
        },
      });
      return;
    }

    // 예외
    dispatch(action.removeTab({ id: tabId }));
    history.replace(redirectUrl);
  };

  const hasChangingTab =
    tabs.every((tab: any) => tab.changed === false) && changed;

  return (
    <ListTabStyle.Wrapper>
      <ListTabStyle.FixedWrapper>
        <ListTabStyle.Inner>
          <ListTabStyle.Left>
            {isAddAuthority && (
              <ListTabStyle.AddButton to={createUrl} onClick={handleAdd}>
                {t("common.add")}
              </ListTabStyle.AddButton>
            )}
            <ListTabStyle.ListTab to={redirectUrl}>
              {t("listTabs.list")}
            </ListTabStyle.ListTab>
            <ListTabStyle.AllCloseButton type="button" onClick={handleAllClose}>
              <Icon icon="close" size="0.5rem" />
            </ListTabStyle.AllCloseButton>
            <ListTabItemList
              tabs={tabs}
              redirectUrl={redirectUrl}
              title={title}
              onClose={handleClose}
            />
            {hasChangingTab && (
              <ListTabStyle.AddItem
                to={createUrl}
                onClose={handleClose}
                active={detailId === "write"}
                name={
                  i18n.language === "en" ? `Editing ${type}` : `${type} 에디터`
                }
              />
            )}
          </ListTabStyle.Left>
          <ListTabStyle.Right>
            <ListHistoryTab />
          </ListTabStyle.Right>
        </ListTabStyle.Inner>
      </ListTabStyle.FixedWrapper>
    </ListTabStyle.Wrapper>
  );
};

export default ListTab;
