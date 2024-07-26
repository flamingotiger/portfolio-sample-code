import React, { useCallback, useEffect } from "react";
import Header from "components/Header";
import Layout from "components/Layout";
import LayoutInner from "components/LayoutInner";
import ProfilePageHeader from "pages/Client/Profile/components/ProfilePageHeader";
import { styled } from "styled-components";
import { ROUTE_NAMES } from "utils/constants/route.constants";
import { useNavigate } from "react-router-dom";
import {
  ACCOUNT_PROFILE_STEP_INDEX,
  accountProfileSelector,
} from "store/reducers/client/profile/accountProfile";
import { useDispatch, useSelector } from "react-redux";
import { MetaApi } from "lib";
import { metaActions } from "store/reducers/client/meta";
import AccountProfileNavigation from "./components/AccountProfileNavigation";
import UserProfileSection from "./pages/UserProfileSection";
import PaymentSection from "./pages/PaymentSection";
import ShippingSection from "./pages/ShippingSection";
import AgentSection from "./pages/AgentSection";

const AccountProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { stepIndex } = useSelector(accountProfileSelector);

  const fetchMetaData = useCallback(async () => {
    try {
      const { data } = await MetaApi.list();
      if (data.tables?.length) {
        const clients = data.tables.find(
          (table: any) => table.name === "clients"
        );
        const dispatchData = (fieldName: string, action: any) => {
          const field = clients.fields.find((f: any) => f.name === fieldName);
          const fieldOptions = field?.options?.choices.map(
            (choice: any) => choice.name
          );
          dispatch(action({ type: fieldName, options: fieldOptions }));
        };

        if (clients) {
          dispatchData("main activity", metaActions.setOptions);
          dispatchData("payment type1", metaActions.setOptions);
          dispatchData("business type", metaActions.setOptions);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchMetaData();
  }, [dispatch, fetchMetaData]);

  return (
    <Layout>
      <Header />
      <LayoutInner>
        <Wrapper>
          <PageHeader title="ACCOUNT PROFILE" />
          <SubHeader>
            <PrevButton
              type="button"
              onClick={() => navigate(ROUTE_NAMES.PROFILE_ACCOUNT)}
            >
              &lt; PREVIOUS
            </PrevButton>
          </SubHeader>
          <Container>
            <NavSection>
              <AccountProfileNavigation />
            </NavSection>
            <Section>
              {stepIndex === ACCOUNT_PROFILE_STEP_INDEX.PROFILE && (
                <UserProfileSection />
              )}
              {stepIndex === ACCOUNT_PROFILE_STEP_INDEX.SHIPPING && (
                <ShippingSection />
              )}
              {stepIndex === ACCOUNT_PROFILE_STEP_INDEX.PAYMENT && (
                <PaymentSection />
              )}
              {stepIndex === ACCOUNT_PROFILE_STEP_INDEX.AGENT && (
                <AgentSection />
              )}
            </Section>
          </Container>
        </Wrapper>
      </LayoutInner>
    </Layout>
  );
};

const Wrapper = styled.div`
  margin-top: 0.625rem;
`;
const PageHeader = styled(ProfilePageHeader)`
  background-color: ${({ theme }) => theme.color.black};
`;

const SubHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid rgba(34, 34, 34, 0.1);
  height: 4.375rem;
`;

const PrevButton = styled.button`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.375rem 0.625rem;
  background-color: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.black};
  font-weight: 500;
  font-family: ${({ theme }) => theme.font.family.primary};
  font-size: ${({ theme }) => theme.font.size[14]};
  letter-spacing: 0em;
  line-height: 1.4;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.color.black};
    color: ${({ theme }) => theme.color.white};
    text-decoration: underline;
  }
`;

const Container = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0 11.25rem;
  box-sizing: border-box;
`;

const NavSection = styled.div`
  flex: 3.8;
`;
const Section = styled.div`
  flex: 6.2;
  padding-left: 1.875rem;
  box-sizing: border-box;
`;

export default AccountProfilePage;
