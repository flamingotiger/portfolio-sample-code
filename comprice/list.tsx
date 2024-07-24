import React, { useEffect, useState } from "react";
import { ItemStatus, ItemType } from "lib/types";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import ItemModal from "components/ItemModal";
import { Toast } from "react-bootstrap";
import ListPagination from "components/ListPagination";
import { ItemApi } from "lib";
import PrivatePage from "components/PrivatePage";
import useGetSearchParams from "hooks/useGetSearchParams";
import { settingActions } from "store/reducers/setting";
import { useDispatch } from "react-redux";
import { RouteParams, RoutePaths } from "utils/constants/route.constants";
import { FoodRestrictionValue } from "components/FoodRestrictionFilter";
import TodoProductListPresenter from "./TodoProductListPresenter";

const TodoProductListContainer: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pageIndex, origin, country } = useGetSearchParams();
  const [items, setItems] = useState<ItemType[]>([]);
  const [isShow, setIsShow] = useState(false);
  const [itemId, setItemId] = useState<string>("");
  const [selectCategory, setSelectCategory] = useState("All");

  const [count, setCount] = useState(0);
  const limit = 30;
  const currentPage = Number(pageIndex || 1);
  const skip = (currentPage - 1) * limit;

  const [totalCount, setTotalCount] = useState(0);
  const [selectFoodRestriction, setSelectFoodRestriction] = useState({
    label: "",
    value: "",
  });

  const { isLoading, refetch } = useQuery(
    [skip, limit, origin, country, selectCategory, selectFoodRestriction],
    () => {
      const query: any = {
        skip,
        limit,
        status: "todo",
        sort: "name,-updatedAt",
        populate: "image,images",
      };

      if (selectCategory !== "All") {
        query.category = `/${selectCategory}/i`;
      }

      if (origin) {
        query.origin = `/${origin}/i`;
      }

      if (country) {
        query.country = `/${country}/i`;
      }

      if (selectFoodRestriction.value === FoodRestrictionValue.vegan) {
        query.isVegan = true;
      }

      if (selectFoodRestriction.value === FoodRestrictionValue.allergy) {
        query.allergies = "exist";
      }

      if (
        selectFoodRestriction.value === FoodRestrictionValue.allergyAndVegan
      ) {
        query.isVegan = true;
        query.allergies = "exist";
      }
      return ItemApi.list(query);
    },
    {
      retry: false,
      cacheTime: 0,
      onSuccess: (data) => {
        setCount(data.counts);
        setItems(data.items);
      },
    }
  );

  useEffect(() => {
    const getTotalCount = async () => {
      try {
        const item = await ItemApi.counts({
          origin: origin ? `/${origin}/i` : "",
          country: country ? `/${country}/i` : "",
        });
        setTotalCount(item.counts);
      } catch (error) {
        console.log(error);
      }
    };
    getTotalCount();
  }, [origin, country]);

  useEffect(() => {
    // 쿼리에 파라미터가 없으면 기본 페이지로 이동
    const isNotPagination = Number(pageIndex) <= 0 || !pageIndex;
    const isNotOrigin = !origin;
    const isNotCountry = !country;
    if (isNotPagination || isNotOrigin || isNotCountry) {
      const { Todo } = RoutePaths;
      const { PagingIndex, Country, Origin } = RouteParams;
      navigate(
        `${Todo}?${PagingIndex}=1&${Country}=${country}&${Origin}=${origin}`
      );
    }
  }, [navigate, pageIndex, origin, country]);

  useEffect(() => {
    dispatch(settingActions.setOrigin(origin));
    dispatch(settingActions.setCountry(country));
  }, [origin, country, dispatch]);

  const handleClose = () => {
    setIsShow(false);
    setItemId("");
  };
  const handleShow = (p: string) => {
    setIsShow(true);
    setItemId(p);
  };
  const handleModalCallback = () => {
    refetch();
    setItemId("");
    handleClose();
  };
  const handlePagination = (p: number) => {
    const { Country, Origin, PagingIndex } = RouteParams;
    const query = `${PagingIndex}=${p}&${Country}=${country}&${Origin}=${origin}`;
    navigate(`${RoutePaths.Todo}?${query}`);
  };

  const [isToast, setIsToast] = useState(false);
  const [toast, setToast] = useState({ title: "", message: "" });
  const handleToast = (title: string, message: string) => {
    setIsToast(true);
    setToast({ title, message });
  };

  const handleItemLate = async (id: string) => {
    try {
      const item = await ItemApi.update(id, { status: ItemStatus.LATE });
      if (item) {
        handleToast("Success", "Item is late");
        refetch();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectCategory = (category: string) => {
    const { PagingIndex, Country, Origin } = RouteParams;
    const { Todo } = RoutePaths;
    const query = `${PagingIndex}=1&${Country}=${country}&${Origin}=${origin}`;
    navigate(`${Todo}?${query}`);
    setSelectCategory(category);
  };
  const handleSelectFoodRestriction = (option: {
    label: string;
    value: string;
  }) => {
    setSelectFoodRestriction(option);
  };
  return (
    <PrivatePage>
      <TodoProductListPresenter
        items={items}
        isLoading={isLoading}
        count={count}
        totalCount={totalCount}
        selectCategory={selectCategory}
        selectFoodRestriction={selectFoodRestriction}
        onShow={handleShow}
        onItemLate={handleItemLate}
        onSelectCategory={handleSelectCategory}
        onSelectFoodRestriction={handleSelectFoodRestriction}
      />
      <ListPagination
        currentPage={currentPage}
        onPagination={handlePagination}
        count={count}
        limit={limit}
      />
      {itemId && (
        <ItemModal
          itemId={itemId}
          isShow={isShow}
          onClose={handleClose}
          onCallback={handleModalCallback}
          onToast={handleToast}
        />
      )}
      <Toast
        onClose={() => setIsToast(false)}
        show={isToast}
        delay={3000}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
        }}
        autohide
      >
        <Toast.Header>
          <strong className="me-auto">{toast.title}</strong>
        </Toast.Header>
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>
    </PrivatePage>
  );
};

export default TodoProductListContainer;
