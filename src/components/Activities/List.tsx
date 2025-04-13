import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import InfiniteScroll from 'react-infinite-scroll-component';
import { groupBy, orderBy } from 'lodash';
import moment from 'moment';
import { DivFlex, SecondaryLabel } from 'src/components';
import ActivityGroup from './ActivityGroup';
import Filters from './Filters';
import { LocalActivity } from './types';
import { StatusValue } from './Filters/types';
import { useAppSelector } from 'src/stores/hooks';
import { getAccount } from 'src/stores/slices/wallet';
import { useFungibleTokensList } from 'src/hooks/fungibleTokens';
import { transactionToActivity } from './utils';
import { getLocalActivities, getPendingCrossChainRequestKey } from '@Utils/storage';
import { getSelectedNetwork } from 'src/stores/slices/extensions';
import { MAINNET_NETWORK_ID } from '@Utils/chainweb';
import { ECKO_DEXTOOLS_API_URL } from '@Utils/constant';

const Div = styled.div`
  cursor: pointer;
`;
const DivChild = styled.div`
  margin-right: ${(props) => props.marginRight};
  color: ${(props) => props.color};
  font-size: ${(props) => props.fontSize};
`;

const DivScroll = styled.div`
  display: block;
  padding-bottom: 90px;
`;

interface Props {
  openActivityDetail: (activity: LocalActivity) => void;
}

const limit = 15;

const List = ({ openActivityDetail }: Props) => {
  const [pendingCrossChainRequestKeys, setPendingCrossChainRequestKeys] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusValue>();
  const [token, setToken] = useState<string>();
  const [transactions, setTransactions] = useState<LocalActivity[]>();
  const tokens = useFungibleTokensList();

  const account = useAppSelector(getAccount);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const selectedNetwork = useAppSelector(getSelectedNetwork);

  const fetchTransactions = async () => {
    try {
      const apiUrl = `${ECKO_DEXTOOLS_API_URL}api/account-transaction-history?account=${account}&limit=${limit}&skip=${skip}`;
      const res = await fetch(apiUrl);
      const transactions = await res.json();

      if (transactions.length < limit) {
        setHasMore(false);
      }
      const newActivities: LocalActivity[] = [];
      for (let i = 0; i < transactions.length; i += 1) {
        const transaction = transactions[i];
        const activity = transactionToActivity(transaction, tokens);

        if (activity) {
          newActivities.push(activity);
        }
      }

      setTransactions((prev) => [...(prev || []), ...newActivities]);
      setSkip((prev) => prev + limit);
    } catch (err) {
      console.error('Errore durante il fetch:', err);
    }
  };

  const isMainnet = selectedNetwork.networkId === MAINNET_NETWORK_ID;

  useEffect(() => {
    if (isMainnet) {
      fetchTransactions();
    }
  }, [isMainnet]);

  useEffect(() => {
    getLocalActivities(
      selectedNetwork.networkId,
      account,
      (activities: LocalActivity[]) => {
        let localActivities: LocalActivity[] = [];
        if (!isMainnet) {
          localActivities = activities.filter((activity) => activity.status !== 'pending');
        }
        const pendingActivities = activities.filter((activity) => activity.status === 'pending');
        setTransactions((prev) => [...(prev || []), ...pendingActivities, ...localActivities]);
      },
      () => {},
    );

    getPendingCrossChainRequestKey().then((pendingTx) => {
      if (!pendingTx) return;
      setPendingCrossChainRequestKeys(pendingTx.map((tx) => tx.requestKey));
    });
  }, [account, selectedNetwork.networkId]);

  const sorted = useMemo(() => {
    const localActivities = transactions || [];
    const filteredActivitiesByStatus = status
      ? localActivities.filter((activity) => {
          switch (status) {
            case 'IN':
              return activity.direction === 'IN';
            case 'OUT':
              return activity.direction === 'OUT';
            case 'PENDING':
              return activity.status === 'pending';
            default:
              return true;
          }
        })
      : localActivities;
    const filteredActivities = token ? filteredActivitiesByStatus.filter((activity) => activity.module === token) : filteredActivitiesByStatus;

    const groupedActivities = groupBy(filteredActivities, (activity) => moment(new Date(activity.createdTime)).format('DD/MM/YYYY'));

    const sortedActivities = Object.keys(groupedActivities).reduce((acc, key) => {
      acc[key] = orderBy(groupedActivities[key], (activity) => moment(new Date(activity.createdTime)).unix(), 'desc');
      return acc;
    }, {} as Record<string, LocalActivity[]>);

    const sortedKeys = Object.keys(groupedActivities).sort((a, b) => moment(b, 'DD/MM/YYYY').unix() - moment(a, 'DD/MM/YYYY').unix());
    const withSortedKeys = sortedKeys.reduce((acc, key) => {
      acc.set(key, sortedActivities[key]);
      return acc;
    }, new Map<string, LocalActivity[]>());

    return withSortedKeys;
  }, [transactions, status, token]);

  const todayString = moment().format('DD/MM/YYYY');
  const todayActivities = sorted.get(todayString);
  const yesterdayString = moment().subtract(1, 'days').format('DD/MM/YYYY');
  const yesterdayActivities = sorted.get(yesterdayString);
  const keys = [...sorted.keys()];

  return (
    <Div>
      <Filters status={status} onChangeStatus={setStatus} token={token} onChangeToken={setToken} />
      {keys.length ? (
        <DivChild>
          <DivScroll>
            <InfiniteScroll dataLength={transactions?.length ?? 0} next={fetchTransactions} hasMore={hasMore} loader={<h4>Loading...</h4>}>
              {todayActivities && (
                <ActivityGroup
                  label="Today"
                  activities={todayActivities}
                  pendingCrossChainRequestKeys={pendingCrossChainRequestKeys}
                  openActivityDetail={openActivityDetail}
                />
              )}

              {yesterdayActivities && (
                <ActivityGroup
                  label="Yesterday"
                  activities={yesterdayActivities}
                  pendingCrossChainRequestKeys={pendingCrossChainRequestKeys}
                  openActivityDetail={openActivityDetail}
                />
              )}

              {keys
                .filter((key) => key !== yesterdayString && key !== todayString)
                .map((date) => (
                  <ActivityGroup
                    key={date}
                    label={moment(date, 'DD/MM/YYYY').format('DD/MM/YYYY')}
                    activities={sorted.get(date) || []}
                    pendingCrossChainRequestKeys={pendingCrossChainRequestKeys}
                    openActivityDetail={openActivityDetail}
                  />
                ))}
            </InfiniteScroll>
          </DivScroll>
        </DivChild>
      ) : (
        <DivFlex marginTop="200px">
          <SecondaryLabel textCenter style={{ flex: 1 }}>
            You have no transactions
          </SecondaryLabel>
        </DivFlex>
      )}
    </Div>
  );
};

export default List;
