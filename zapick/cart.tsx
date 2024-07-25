import React, { ChangeEvent, useEffect, useState } from "react";
import Header from "components/Header";
import Layout from "components/Layout";
import { StyledLayout } from "pages/Client/Profile/styles/layout";
import ProfileNav from "pages/Client/Profile/components/ProfileNav";
import ProfilePageHeader from "pages/Client/Profile/components/ProfilePageHeader";
import { styled } from "styled-components";
import LayoutInner from "components/LayoutInner";
import { useDispatch, useSelector } from "react-redux";
import { cartActions, cartSelector } from "store/reducers/client/cart";
import { userSelector } from "store/reducers/client/user";
import {
  ClientFieldsType,
  OptionFieldsType,
  RecordType,
} from "lib/types/airtable";
import { CartApi, MemberShipApi, OrderApi, OrderItemApi } from "lib";
import { useNavigate } from "react-router-dom";
import { ROUTE_NAMES } from "utils/constants/route.constants";
import { v4 as uuidv4 } from "uuid";
import {
  membershipActions,
  membershipSelector,
} from "store/reducers/client/membership";
import { pointHelper, round, saleHelper } from "utils/helpers/saleHelper";
import Modal from "components/Modal";
import Loader from "components/Loader";
import NoItemInfo from "components/NoItemInfo";
import CartItem from "./components/CartItem";

const CartPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    carts,
    shippings,
    payments,
    selectedPayment,
    selectedShipping,
    selectedCartIds,
  } = useSelector(cartSelector);
  const { user } = useSelector(userSelector);
  const { membership } = useSelector(membershipSelector);

  // order progress modal action
  const [isFetchOrderModal, setIsFetchOrderModal] = useState<boolean>(false);
  const [isCompletedOrder, setIsCompletedOrder] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>("");
  const [isFetchError, setIsFetchError] = useState<boolean>(false);

  useEffect(() => {
    // user의 값을 불러와서
    // client의 shipping과 payment를 불러온다.
    // 그리고 그 값을 기본값으로 넣어준다.
    if (!user.client) return;
    const shippingInfos = extractShippingInfos(user.client.fields);
    const paymentInfos = extractPaymentInfos(user.client.fields);
    if (shippingInfos.length > 0) {
      dispatch(
        cartActions.setSelectedOption({
          type: "shipping",
          value: shippingInfos[0].value,
        })
      );
    }
    if (paymentInfos.length > 0) {
      dispatch(
        cartActions.setSelectedOption({
          type: "payment",
          value: paymentInfos[0].value,
        })
      );
    }
    dispatch(
      cartActions.setSelectBoxOptions({
        type: "shipping",
        value: shippingInfos,
      })
    );
    dispatch(
      cartActions.setSelectBoxOptions({
        type: "payment",
        value: paymentInfos,
      })
    );
  }, [dispatch, user]);

  useEffect(() => {
    const getCart = async () => {
      try {
        const cartResponse = await CartApi.me();
        dispatch(cartActions.setCarts(cartResponse.data.carts));
      } catch (error) {
        console.log(error);
      }
    };
    getCart();
  }, [dispatch]);

  const submitOrder = async () => {
    if (!selectedShipping || !selectedPayment) return;

    if (selectedCartIds.length === 0) {
      alert("Please select an item.");
      return;
    }

    try {
      setIsCompletedOrder(false);
      setIsFetchOrderModal(true);
      const selectedCarts = carts.filter((cart) =>
        selectedCartIds.includes(cart.airtableId)
      );

      const orderOptions: RecordType<OptionFieldsType>[] = [];
      selectedCarts.forEach((cart) => {
        for (let i = 0; cart.amount > i; i += 1) {
          if (!cart.airtableValue) return;
          orderOptions.push(cart.airtableValue);
        }
      });

      const processOrderItems = async () => {
        // create order items
        const orderItemPromises = orderOptions.map((option) => {
          const { fields } = option;
          const discountedPrice = saleHelper(
            fields.price,
            fields.sale,
            membership?.fields
          );
          const orderItemData = {
            fields: {
              "order number": uuidv4(),
              "item name": fields["itemName"]?.[0] || "",
              "option name": fields["option"] || "",
              size: fields.size || "",
              unit: fields.unit || "",
              price: `${discountedPrice || 0}`,
              client: [user.client?.id || ""],
              "client member": [user.clientMember?.id || ""],
              "shipping address": selectedShipping,
              "payment info": selectedPayment,
              image: [{ url: fields.photos?.[0].thumbnails.full.url || "" }],
              "order date": new Date().toISOString(),
              // TODO: option에 hs code name으로 들어가야함
              // 'hs code': fields['hs code'] || ''
            },
          };
          return OrderItemApi.post(orderItemData);
        });
        const response = await Promise.all(orderItemPromises);
        const array: { orderItemsIds: string[]; totalPrice: number } = {
          orderItemsIds: [],
          totalPrice: 0,
        };
        const { orderItemsIds, totalPrice } = response.reduce((acc, res) => {
          if (res.data?.id) {
            acc.orderItemsIds.push(res.data.id);
            acc.totalPrice += Number(res.data.fields.price);
          }
          return acc;
        }, array);
        return {
          orderItemsIds,
          totalPrice,
          totalAmount: response.length,
        };
      };

      const { orderItemsIds, totalPrice, totalAmount } =
        await processOrderItems();

      const createOrder = async () => {
        // create order
        const orderData = {
          fields: {
            "order group number": uuidv4(),
            orderItems: orderItemsIds,
            "client member": [user.clientMember?.id || ""],
            "shipping address": selectedShipping,
            "payment info": selectedPayment,
            "total amount": `${totalAmount}`,
            "total price": `${totalPrice}`,
            "order date": new Date().toISOString(),
          },
        };
        return OrderApi.post(orderData);
      };

      // 포인트 적립
      const savePoint = async () => {
        if (user.client?.fields.membership) {
          const point = pointHelper(totalPrice);
          if (point <= 0) return;
          const body = {
            fields: { point: Number(membership?.fields.point) + point },
          };
          await MemberShipApi.patch(membership?.id || "", body);
          dispatch(membershipActions.addPoint(point));
        }
      };

      const clearSelectedCarts = async () => {
        // eslint-disable-next-line no-underscore-dangle
        const deleteCartPromises = selectedCarts.map((cart) =>
          CartApi.delete(cart._id as string)
        );
        await Promise.all(deleteCartPromises);
        dispatch(cartActions.resetCarts());
      };

      const orderResponse = await createOrder();
      setOrderId(orderResponse.data.id);
      setIsCompletedOrder(true);

      await savePoint();
      await clearSelectedCarts();
    } catch (error) {
      setIsCompletedOrder(false);
      setIsFetchError(true);
    }
  };

  const getCartOptionsLength = () => {
    if (!carts.length) return 0;
    const selectedCarts = carts.filter((cart) =>
      selectedCartIds.includes(cart.airtableId)
    );
    let count = 0;
    selectedCarts.forEach((cart) => {
      count += cart.amount;
    });
    return count;
  };

  const getCartOptionsTotalPrice = () => {
    if (!carts.length) return 0;
    let totalPrice = 0;
    const selectedCarts = carts.filter((cart) =>
      selectedCartIds.includes(cart.airtableId)
    );

    selectedCarts.forEach((cart) => {
      if (!cart.airtableValue?.fields) return;
      const { amount } = cart;
      const discountedPrice = saleHelper(
        cart.airtableValue?.fields.price,
        cart.airtableValue?.fields.sale,
        membership?.fields
      );
      totalPrice += round(discountedPrice * amount, 2);
    });
    return totalPrice;
  };

  const totalItemsLengthText = `${getCartOptionsLength()} ITEMS`;
  const totalPriceText = `$${getCartOptionsTotalPrice()}`;
  return (
    <>
      <Modal isOpen={isFetchOrderModal}>
        {isFetchError ? (
          <ModalWrapper>
            <ModalContainer>
              <ModalContent>
                <ModalText>Please retry</ModalText>
                <ModalRedirectButton
                  type="button"
                  onClick={() => setIsFetchOrderModal(false)}
                >
                  Close
                </ModalRedirectButton>
              </ModalContent>
            </ModalContainer>
          </ModalWrapper>
        ) : (
          <ModalWrapper>
            <ModalContainer>
              <ModalContent>
                <ModalText>Order received</ModalText>
                <ModalText>it may take few time.</ModalText>
                <ModalText>thank you for your patience.</ModalText>
                {isCompletedOrder && (
                  <ModalRedirectButton
                    type="button"
                    onClick={() =>
                      navigate(`${ROUTE_NAMES.PROFILE_ORDER}/${orderId}`)
                    }
                  >
                    View Order
                  </ModalRedirectButton>
                )}
              </ModalContent>
              {!isCompletedOrder && <Loader isAuto isWhite />}
            </ModalContainer>
          </ModalWrapper>
        )}
      </Modal>
      <Layout>
        <Header />
        <LayoutInner>
          <StyledLayout.Wrapper>
            <StyledLayout.NavigationSection>
              <ProfileNav />
            </StyledLayout.NavigationSection>
            <StyledLayout.PageSection>
              <PageHeader
                title="CART"
                totalItemsLengthText={totalItemsLengthText}
                totalPriceText={totalPriceText}
              />
              <SubHeader>
                <div>
                  <Select
                    placeholder="shipping address"
                    value={selectedShipping || ""}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      dispatch(
                        cartActions.setSelectedOption({
                          type: "shipping",
                          value: e.target.value,
                        })
                      )
                    }
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    {shippings.length > 0 &&
                      shippings.map((option, idx) => {
                        const index = `${idx + 1}`;
                        return (
                          <option key={index} value={option.value}>
                            {option.label}
                          </option>
                        );
                      })}
                  </Select>
                  <Select
                    placeholder="payment type"
                    value={selectedPayment || ""}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      dispatch(
                        cartActions.setSelectedOption({
                          type: "payment",
                          value: e.target.value,
                        })
                      )
                    }
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    {payments.length > 0 &&
                      payments.map((option, idx) => {
                        const index = `${idx + 1}`;
                        return (
                          <option key={index} value={option.value}>
                            {option.label}
                          </option>
                        );
                      })}
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={submitOrder}
                  $disabled={
                    !selectedPayment || !selectedShipping || !(carts.length > 0)
                  }
                  disabled={
                    !selectedPayment || !selectedShipping || !(carts.length > 0)
                  }
                >
                  Check out
                </Button>
              </SubHeader>
              <CartList>
                {carts.length > 0 ? (
                  carts.map((cart) => (
                    <Item key={cart.airtableId} cart={cart} />
                  ))
                ) : (
                  <NoItemInfo>No item added.</NoItemInfo>
                )}
              </CartList>
            </StyledLayout.PageSection>
          </StyledLayout.Wrapper>
        </LayoutInner>
      </Layout>
    </>
  );
};

const ModalWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.75rem 8.125rem;
  background-color: ${({ theme }) => theme.color.black};
`;

const ModalContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
`;

const ModalContent = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
`;
const ModalText = styled.span`
  display: block;
  color: ${({ theme }) => theme.color.white};
  font-family: ${({ theme }) => theme.font.family.primary};
  font-size: ${({ theme }) => theme.font.size[16]};
  letter-spacing: 0em;
  line-height: 1.2;
  font-weight: 400;
  margin-bottom: 0.125rem;
  margin-left: 0.25rem;
  text-align: left;
  margin-bottom: 0.625rem;
`;

const ModalRedirectButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.black};
  font-family: ${({ theme }) => theme.font.family.primary};
  font-size: ${({ theme }) => theme.font.size[16]};
  letter-spacing: 0em;
  line-height: 1.2;
  font-weight: 300;
  width: 12.5rem;
  height: 2.625rem;
  margin-top: 1.25rem;
  cursor: pointer;
`;

const PageHeader = styled(ProfilePageHeader)`
  background-color: ${({ theme }) => theme.color.cart};
`;
const SubHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
  background-color: #ededed;
  padding: 0.5rem;
`;
const Select = styled.select`
  position: relative;
  width: 16.25rem;
  border: 1px solid #222222;
  font-family: ${({ theme }) => theme.font.family.primary};
  font-size: ${({ theme }) => theme.font.size[14]};
  background-color: #f5f5f5;
  letter-spacing: 0em;
  line-height: 1.2;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.375rem 0.5rem;
  cursor: pointer;
  &:first-child {
    margin-bottom: 0.3125rem;
  }
  &:hover {
    color: ${({ theme }) => theme.color.white};
    background-color: #222222;
  }

  background-image: url("/images/ico_dropdown.png");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 0.625rem 0.5rem;
`;
const Button = styled.button<{ $disabled: boolean }>`
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 3.75rem;
  background-color: ${({ theme }) => theme.color.black};
  color: ${({ theme }) => theme.color.white};
  font-family: ${({ theme }) => theme.font.family.primary};
  font-size: ${({ theme }) => theme.font.size[18]};
  letter-spacing: 0em;
  line-height: 1.2;
  cursor: pointer;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.25);

  ${({ $disabled }) => $disabled && `opacity: 0.5; cursor: not-allowed;`}
`;
const CartList = styled.ul``;
const Item = styled(CartItem)``;

const extractShippingInfos = (fields: ClientFieldsType) => {
  const shippingInfos: { label: string; value: string }[] = [];
  const join = (arr: string[]) => arr.filter((item) => item).join(", ");

  const convertingValueToString = (
    name = "",
    city = "",
    country = "",
    address1 = "",
    address2 = ""
  ) => {
    if (name && city && country && address1) {
      shippingInfos.push({
        label: join([address2, address1, city, country]),
        value: join([address2, address1, city, country]),
      });
    }
  };

  convertingValueToString(
    fields["shipping name1"],
    fields["shipping address1 city"],
    fields["shipping address1 country"],
    fields["shipping address1-1"]
  );
  convertingValueToString(
    fields["shipping name2"],
    fields["shipping address2 city"],
    fields["shipping address2 country"],
    fields["shipping address2-1"]
  );
  convertingValueToString(
    fields["shipping name3"],
    fields["shipping address3 city"],
    fields["shipping address3 country"],
    fields["shipping address3-1"]
  );

  return shippingInfos;
};

const extractPaymentInfos = (fields: ClientFieldsType) => {
  const paymentInfos: { label: string; value: string }[] = [];

  const convertingValueToString = (type = "", info = "") => {
    if (type) {
      paymentInfos.push({
        label: `${type}, ${info}`,
        value: `${type}, ${info}`,
      });
    }
  };

  convertingValueToString(fields["payment type1"], fields["payment info1"]);
  convertingValueToString(fields["payment type2"], fields["payment info2"]);

  return paymentInfos;
};

export default CartPage;
