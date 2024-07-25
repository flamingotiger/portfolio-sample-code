/* eslint-disable no-underscore-dangle */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import { styled } from "styled-components";
import { useQuery } from "react-query";
import Header from "components/Header";
import Layout from "components/Layout";
import { CartApi, OptionApi } from "lib";
import { OptionFieldsType, RecordType } from "lib/types/airtable";
import { useDispatch, useSelector } from "react-redux";
import { userSelector } from "store/reducers/client/user";
import LayoutInner from "components/LayoutInner";
import { cartActions, cartSelector } from "store/reducers/client/cart";
import { ROUTE_NAMES } from "utils/constants/route.constants";
import Loader from "components/Loader";
import { toastActions } from "store/reducers/toast";
import SimilarProducts from "./components/SimilarProducts";
import useItem from "./hooks/useItem";
import ImageSection from "./layout/ImageSection";
import ProductInfoSection from "./layout/ProductInfoSection";
import { sortedArr } from "./helpers/sort";

const ShopDetailPage: React.FC = () => {
  const { item, itemBrand, isLoading } = useItem();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector(userSelector);
  const { carts } = useSelector(cartSelector);
  const dispatch = useDispatch();

  const [isCartLoading, setIsCartLoading] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<string>("1");
  const [selectedColorOption, setSelectedColorOption] =
    useState<RecordType<OptionFieldsType> | null>(null);
  const [selectedSizeOption, setSelectedSizeOption] =
    useState<RecordType<OptionFieldsType> | null>(null);

  const [colorOptions, setColorOptions] = useState<
    RecordType<OptionFieldsType>[]
  >([]);
  const [sizeOptions, setSizeOptions] = useState<
    RecordType<OptionFieldsType>[]
  >([]);

  const [options, setOptions] = useState<RecordType<OptionFieldsType>[]>([]);

  const [similarProducts, setSimilarProducts] = useState<
    RecordType<OptionFieldsType>[]
  >([]);

  const fetchSimilarOptionsParams = () => {
    const filterByFormula =
      item &&
      item.fields["similar products"] &&
      item.fields["similar products"].length > 0
        ? `OR(${item.fields["similar products"]
            ?.map((product) => `RECORD_ID() = '${product}'`)
            .join(",")})`
        : "";
    const filter = {
      filterByFormula,
    };
    return {
      filter,
    };
  };
  const fetchSimilarOptions = () => {
    const params = fetchSimilarOptionsParams();
    return OptionApi.list(params);
  };
  useQuery(["similarProducts", item], fetchSimilarOptions, {
    onSuccess: (data) => {
      setSimilarProducts(data.data.records);
    },
  });

  const fetchOptionsParams = () => {
    const filterByFormula = item
      ? `OR(${item.fields?.options
          ?.map((option) => `RECORD_ID() = '${option}'`)
          .join(",")})`
      : "";
    const filter = {
      filterByFormula,
    };
    return {
      filter,
    };
  };
  const fetchOptions = () => {
    const params = fetchOptionsParams();
    return OptionApi.list(params);
  };
  useQuery(["options", item], fetchOptions, {
    onSuccess: (data) => {
      setOptions(data.data.records);
    },
  });

  useEffect(() => {
    // color option 초기화
    const getColorOptions = (
      optionsArr: RecordType<OptionFieldsType>[]
    ): RecordType<OptionFieldsType>[] => {
      return optionsArr.reduce<RecordType<OptionFieldsType>[]>(
        (accOptions, curOption) => {
          const foundSameOption = accOptions.find(
            (o) => o.fields.option === curOption.fields.option
          );
          if (!foundSameOption) {
            return [...accOptions, curOption];
          }

          const notFoundImage = !(
            foundSameOption.fields.photos &&
            foundSameOption.fields.photos.length > 0
          );
          const foundIndex = accOptions.findIndex(
            (o) => o.fields.option === curOption.fields.option
          );
          const moreBiggerSize =
            foundSameOption.fields.size < curOption.fields.size;

          if (notFoundImage || moreBiggerSize) {
            if (curOption.fields.photos?.length > 0) {
              accOptions[foundIndex] = {
                ...accOptions[foundIndex],
                fields: {
                  ...accOptions[foundIndex].fields,
                  photos: curOption.fields.photos,
                },
              };
            }
            return accOptions;
          }

          return accOptions;
        },
        []
      );
    };

    // color option 초기화
    const sortOptions = sortedArr(options);
    const tempColorOptions = getColorOptions(sortOptions);

    setColorOptions(tempColorOptions);
    setSelectedColorOption(tempColorOptions[0]);
  }, [options]);

  useEffect(() => {
    // color가 바뀔때마다 Size option 처음 값으로 변경
    if (!selectedColorOption) return;
    if (options.length === 0) return;

    const addOptionImages = (
      optionsArr: RecordType<OptionFieldsType>[]
    ): RecordType<OptionFieldsType>[] => {
      return optionsArr.reduce<RecordType<OptionFieldsType>[]>(
        (accOptions, curOption) => {
          const notFoundImage = !(
            curOption.fields.photos && curOption.fields.photos.length > 0
          );

          if (notFoundImage) {
            curOption = {
              ...curOption,
              fields: {
                ...curOption.fields,
                photos: selectedColorOption.fields.photos,
              },
            };
            return [...accOptions, curOption];
          }

          return [...accOptions, curOption];
        },
        []
      );
    };

    const autoSelectSizeOption = () => {
      const filterOptions = options.filter(
        (option) => option.fields.option === selectedColorOption?.fields.option
      );
      const sortOptions = sortedArr(filterOptions);
      const addedImageOptions = addOptionImages(sortOptions);
      setSizeOptions(addedImageOptions);
      const newSelectedSizeOption =
        addedImageOptions.length > 0 ? addedImageOptions[0] : null;
      setSelectedSizeOption(newSelectedSizeOption);
      setQuantity("1");
    };

    autoSelectSizeOption();
  }, [options, selectedColorOption]);

  useEffect(() => {
    // 페이지 이동해서 옵션이 선택되는 경우
    const locationInitialOption = () => {
      const state = location.state as { option: string };
      const selectOption = () => {
        if (state && options.length > 0) {
          const optionId = state.option;
          const foundOption = options.find((option) => option.id === optionId);
          if (foundOption) {
            setSelectedColorOption(foundOption);
          }
        }
      };
      selectOption();
    };

    locationInitialOption();
  }, [location, options]);

  const scrollToTopSmoothly = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // similar products에서 같은 item을 선택할 경우 옵션선택
  const handleClickSimilarProduct = (option: RecordType<OptionFieldsType>) => {
    scrollToTopSmoothly();
    navigate(`${ROUTE_NAMES.SHOP}/${option.fields.item[0]}`, {
      state: {
        option: option.id,
      },
    });
  };

  const updateCartLoadingState = async (action: () => Promise<any>) => {
    try {
      await action();
    } catch (error) {
      console.log(error);
    } finally {
      setIsCartLoading(false);
    }
  };

  // 카트에 추가
  const handleAddCart = () => {
    if (!user.clientMember || !selectedSizeOption) return;
    if (Number(quantity) <= 0) return;

    setIsCartLoading(true);
    const foundCart = carts.find(
      (cart) => cart?.airtableId === selectedSizeOption.id
    );

    // eslint-disable-next-line no-underscore-dangle
    if (foundCart && foundCart._id) {
      updateCartLoadingState(async () => {
        const response = await CartApi.patch(foundCart._id as string, {
          airtableId: selectedSizeOption.id,
          tableName: "options",
          amount: Number(quantity) + foundCart.amount,
        });

        if (response) {
          dispatch(
            cartActions.incrementAmount({
              id: selectedSizeOption.id,
              amount: Number(quantity),
            })
          );
          dispatch(toastActions.addToast("Added to cart"));
        }
      });
    } else {
      updateCartLoadingState(async () => {
        const response = await CartApi.post({
          email: user?.clientMember?.fields.email || "",
          airtableId: selectedSizeOption?.id,
          tableName: "options",
          amount: Number(quantity),
        });
        if (response) {
          dispatch(cartActions.addCarts(response.data.cart));
          dispatch(cartActions.selectCart(response.data.cart.airtableId));
          dispatch(toastActions.addToast("Added to cart"));
        }
      });
    }
  };

  const handleChangeSelectedSize = (id: string) => {
    const newSelectedSizeOption =
      sizeOptions.find((option) => option.id === id) || null;
    setSelectedSizeOption(newSelectedSizeOption);
  };

  return (
    <Layout>
      <Header />
      <LayoutInner>
        {isLoading ? (
          <Loader isFull />
        ) : (
          <>
            <Section>
              <ImageSection photos={selectedSizeOption?.fields.photos} />
              <ProductInfoSection
                item={item}
                itemBrand={itemBrand}
                colorOptions={colorOptions}
                sizeOptions={sizeOptions}
                quantity={quantity}
                isCartLoading={isCartLoading}
                selectedColorOption={selectedColorOption}
                selectedSizeOption={selectedSizeOption}
                setSelectedColorOption={setSelectedColorOption}
                onChangeSelectSize={handleChangeSelectedSize}
                setQuantity={setQuantity}
                onAddCart={handleAddCart}
              />
            </Section>
            {similarProducts.length > 0 && (
              <SimilarProducts
                items={similarProducts}
                onClickSimilarProducts={handleClickSimilarProduct}
              />
            )}
          </>
        )}
      </LayoutInner>
    </Layout>
  );
};

const Section = styled.section`
  display: flex;
  border-bottom: 1px solid rgba(34, 34, 34, 0.1);
`;

export default ShopDetailPage;
