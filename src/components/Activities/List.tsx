import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import InfiniteScroll from 'react-infinite-scroll-component';
import { groupBy, orderBy } from 'lodash';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
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

const limit = 25;

const List = ({ openActivityDetail }: Props) => {
  const { t } = useTranslation();
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
        const activity = transactionToActivity(transactions[i], tokens);
        if (activity) newActivities.push(activity);
      }

      setTransactions((prev) => [...(prev || []), ...newActivities]);
      setSkip((prev) => prev + limit);
    } catch (err) {
      console.error('Errore durante il fetch:', err);
    }
  };

  const isMainnet = selectedNetwork.networkId === MAINNET_NETWORK_ID;

  useEffect(() => {
    if (isMainnet) fetchTransactions();
  }, [isMainnet]);

  useEffect(() => {
    getLocalActivities(
      selectedNetwork.networkId,
      account,
      (activities) => {
        let localActivities: LocalActivity[] = [];
        if (!isMainnet) {
          localActivities = activities.filter((a) => a.status !== 'pending');
        }
        const pending = activities.filter((a) => a.status === 'pending');
        setTransactions((prev) => [...(prev || []), ...pending, ...localActivities]);
      },
      () => {},
    );

    getPendingCrossChainRequestKey().then((pendingTx) => {
      if (!pendingTx) return;
      setPendingCrossChainRequestKeys(pendingTx.map((tx) => tx.requestKey));
    });
  }, [account, selectedNetwork.networkId]);

  const sorted = useMemo(() => {
    const all = transactions || [];
    const byStatus = status
      ? all.filter((a) => {
          switch (status) {
            case 'IN':
              return a.direction === 'IN';
            case 'OUT':
              return a.direction === 'OUT';
            case 'PENDING':
              return a.status === 'pending';
            default:
              return true;
          }
        })
      : all;
    const byToken = token ? byStatus.filter((a) => a.module === token) : byStatus;

    const grouped = groupBy(byToken, (a) => moment(new Date(a.createdTime)).format('DD/MM/YYYY'));
    const sortedGroups: Record<string, LocalActivity[]> = {};
    Object.keys(grouped).forEach((key) => {
      sortedGroups[key] = orderBy(grouped[key], (a) => moment(new Date(a.createdTime)).unix(), 'desc');
    });
    const keys = Object.keys(grouped).sort((a, b) => moment(b, 'DD/MM/YYYY').unix() - moment(a, 'DD/MM/YYYY').unix());
    return keys.reduce((map, key) => {
      map.set(key, sortedGroups[key]);
      return map;
    }, new Map<string, LocalActivity[]>());
  }, [transactions, status, token]);

  const today = moment().format('DD/MM/YYYY');
  const yesterday = moment().subtract(1, 'days').format('DD/MM/YYYY');
  const keys = [...sorted.keys()];

  return (
    <Div>
      <Filters status={status} onChangeStatus={setStatus} token={token} onChangeToken={setToken} />
      {keys.length ? (
        <DivChild>
          <DivScroll>
            <InfiniteScroll
              dataLength={transactions?.length ?? 0}
              next={fetchTransactions}
              hasMore={hasMore}
              loader={<h4>{t('activityList.loading')}</h4>}
            >
              {sorted.get(today) && (
                <ActivityGroup
                  label={t('activityList.today')}
                  activities={sorted.get(today)!}
                  pendingCrossChainRequestKeys={pendingCrossChainRequestKeys}
                  openActivityDetail={openActivityDetail}
                />
              )}
              {sorted.get(yesterday) && (
                <ActivityGroup
                  label={t('activityList.yesterday')}
                  activities={sorted.get(yesterday)!}
                  pendingCrossChainRequestKeys={pendingCrossChainRequestKeys}
                  openActivityDetail={openActivityDetail}
                />
              )}
              {keys
                .filter((key) => key !== today && key !== yesterday)
                .map((date) => (
                  <ActivityGroup
                    key={date}
                    label={moment(date, 'DD/MM/YYYY').format('DD/MM/YYYY')}
                    activities={sorted.get(date)!}
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
            {t('activityList.noTransactions')}
          </SecondaryLabel>
        </DivFlex>
      )}
    </Div>
  );
};

export default List;
