import Button from "components/Button/Button";
import Input from "components/Input/Input";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import { GoalApi, SectionApi } from "lib";
import { QUERY_KEY } from "utils/constants/queryKey.constants";
import Label from "components/Label/Label";
import { GoalType, SectionType } from "lib/types";
import HistoryGroup from "./HistoryGroup";
import CurrentHistoryItem from "./CurrentHistoryItem";

interface HistorySectionProps {
  section: SectionType;
}
const HistorySection: React.FC<HistorySectionProps> = ({ section }) => {
  const [leftHour, setLeftHour] = useState(0);
  const { sectionId } = useParams();
  const { data: goalData } = useQuery([QUERY_KEY.GOAL_LIST, sectionId], () =>
    GoalApi.list({ section: sectionId, sort: "-createdAt" })
  );

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!section) return;
    const leftTime = Number(
      (section.setHour - section.goalTotalMinute / 60).toFixed(2)
    );

    setLeftHour(leftTime > 0 ? leftTime : 0);
  }, [section]);

  const invalidateQuery = () => {
    queryClient.invalidateQueries(QUERY_KEY.HEADER);
    queryClient.invalidateQueries(QUERY_KEY.MAIN_SIDE_BAR);
    queryClient.invalidateQueries(QUERY_KEY.SUB_SIDE_BAR);
    queryClient.invalidateQueries(QUERY_KEY.GOAL_AND_NOTE_DETAIL);
  };

  const handleBlur = async () => {
    try {
      let tempLeftHour = leftHour;
      if (leftHour < 0) {
        tempLeftHour = 0;
      }
      const calcSetHour = tempLeftHour + section.goalTotalMinute / 60;

      const res = await SectionApi.update(sectionId, {
        setHour: calcSetHour,
      });
      if (res) {
        invalidateQuery();
      }
    } catch (error) {
      alert("Failed to update section");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeftHour(Number(e.target.value));
  };

  const isEnd =
    goalData &&
    goalData?.goals.length > 0 &&
    goalData.goals.some((goal) => !goal.endDate);

  const createGoal = async () => {
    try {
      const res = await GoalApi.create({
        section: sectionId,
      });
      if (res) {
        queryClient.invalidateQueries([QUERY_KEY.GOAL_LIST, sectionId]);
      }
    } catch (error) {
      alert("Failed to create goal");
    }
  };

  const patchEndDateGoal = async () => {
    const findGoal = goalData?.goals.find((goal) => !goal.endDate);
    if (!findGoal) return;
    try {
      const res = await GoalApi.endDate(findGoal._id);
      if (res) {
        invalidateQuery();
        queryClient.invalidateQueries(QUERY_KEY.GOAL_LIST);
      }
    } catch (error) {
      alert("Failed to end goal");
    }
  };

  const handleGoal = () => {
    if (isEnd) {
      patchEndDateGoal();
    } else {
      createGoal();
    }
  };

  const groupByDate = goalData?.goals
    .filter((g) => g.endDate)
    .reduce<Record<string, GoalType[]>>((acc, item) => {
      if (!item.startDate) return acc;

      // 날짜 포맷 변경
      const formatDate = (date: Date) => {
        return new Date(date).toISOString().split("T")[0];
      };

      const dateKey = formatDate(item.startDate);

      // 해당 날짜 키가 없으면 새로운 배열로 추가
      if (!acc[dateKey]) {
        acc[dateKey] = [item];
      } else {
        // 해당 날짜 키가 있으면 기존 배열에 추가
        acc[dateKey].push(item);
      }

      return acc;
    }, {});

  const transformTotalTime = () => {
    if (!section) return 0;
    if (!section.goalTotalMinute) return 0;
    const { goalTotalMinute } = section;
    return Number((goalTotalMinute / 60).toFixed(2));
  };

  const renderGroup = () => {
    if (!groupByDate) return null;

    const keys = Object.keys(groupByDate);
    if (keys.length === 0)
      return (
        <span className="text-sm font-Fredoka text-white opacity-50 font-normal block">
          make your own history
        </span>
      );

    return Object.entries(groupByDate).map(([date, goals]) => {
      return <HistoryGroup key={date} goals={goals} date={date} />;
    });
  };

  const renderCurrentGoal = () => {
    if (!goalData) return null;
    const currentGoal = goalData.goals.find((goal) => !goal.endDate);
    if (!currentGoal) return null;
    return <CurrentHistoryItem goal={currentGoal} />;
  };

  return (
    <div className="py-5 px-10">
      <h2 className="text-white font-Figtree font-normal text-base mb-10">
        Goal
      </h2>
      <div className="flex items-center mb-6">
        <Label>Time</Label>
        <Input
          className="w-24"
          placeholder="0"
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          isRequired
          value={leftHour}
          onChange={handleChange}
        />
        <span className="block font-Fredoka font-regular text-white px-2.5 text-sm">
          hours left
        </span>
      </div>
      <div className="flex items-center mb-6">
        <Label>Total</Label>
        <span className="block font-Fredoka font-normal text-white px-2.5 text-sm">
          {transformTotalTime()}
        </span>
        <span className="block font-Fredoka font-normal text-white px-2.5 text-sm">
          hours
        </span>
      </div>
      <Button
        type="button"
        className="w-24"
        variable={isEnd ? "secondary" : "primary"}
        onClick={handleGoal}
        disabled={section && section?.setHour <= 0}
      >
        {isEnd ? "End" : "Start"}
      </Button>
      {renderCurrentGoal()}
      <h2 className="text-white font-Figtree font-normal text-base mb-10">
        History
      </h2>
      <div className="overflow-y-scroll pr-4" style={{ height: "37.75rem" }}>
        {renderGroup()}
      </div>
    </div>
  );
};

export default HistorySection;
