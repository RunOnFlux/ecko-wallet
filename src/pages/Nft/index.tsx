/* eslint-disable no-restricted-syntax */
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { DivFlex, PrimaryLabel, SecondaryLabel } from 'src/components';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import { groupBy, chunk } from 'lodash';
import { fetchLocal } from '../../utils/chainweb';
import nftList, { NFTTypes } from './nft-data';
import { NftContainer, NftPageContainer } from './style';
import NftCard from './NftTypes/NftCard';
import MarmaladeNGCollectionList from './NftTypes/MarmaladeNG/MarmaladeNGCollectionList';
import { useAppSelector } from 'src/stores/hooks';
import { useTranslation } from 'react-i18next';
import Spinner from '@Components/Spinner';

const Nft = () => {
  const { t } = useTranslation();
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const history = useHistory();
  const stateWallet = useCurrentWallet();
  const [isLoading, setIsLoading] = useState(true);
  const account = stateWallet?.account;
  const [nftAccount, setNftAccount] = useState<Record<string, any>>({});

  useEffect(() => {
    const promises: Promise<any>[] = [];
    if (!account) return;

    const groupedByChain = groupBy(nftList, 'chainId');
    Object.keys(groupedByChain).forEach((chainId) => {
      const chunked = chunk(groupedByChain[chainId], 2);
      chunked.forEach((chunkArray) => {
        const pactCode = `(
          let* (
            ${chunkArray.map((nft) => `(${nft.pactAlias} ${nft.getAccountBalance(account)})`).join(' ')}
          ) {
            ${chunkArray.map((nft) => `"${nft.pactAlias}": ${nft.pactAlias}`).join(',')}
          }
        )`;
        setIsLoading(true);
        promises.push(fetchLocal(pactCode, selectedNetwork?.url, selectedNetwork?.networkId, chainId));
      });
    });

    Promise.all(promises)
      .then((resArray) => {
        resArray.forEach((res) => {
          if (res?.result?.status === 'success') {
            setNftAccount((prev) => ({
              ...prev,
              ...res.result.data,
            }));
          }
          // setIsLoading(false);
        });
      })
      .catch((err) => {
        console.error('Error fetching NFTs', err);
        setIsLoading(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [account, selectedNetwork]);

  const getNFTTotal = (alias: string) => {
    const nft = nftList.find((n) => n.pactAlias === alias);
    if (nft?.type === NFTTypes.MARMALADE_V2) {
      return nftAccount[alias]?.totalBalance;
    }
    return nftAccount[alias]?.length;
  };

  return (
    <NftPageContainer>
      {isLoading ? (
        <Spinner style={{ margin: '80px auto' }} />
      ) : (
        <>
          <PrimaryLabel fontSize={18} uppercase>
            {t('nft.header')}
          </PrimaryLabel>
          <NftContainer marginTop="40px">
            <MarmaladeNGCollectionList key="ng" />
            {Object.keys(nftAccount).length > 0 ? (
              Object.keys(nftAccount)
                .sort((a, b) => a.localeCompare(b))
                .map((alias) => {
                  const nft = nftList.find((n) => n.pactAlias === alias);
                  if (!nft) return null;
                  return (
                    <NftCard
                      key={nft.displayName}
                      src={nft.pic}
                      label={
                        <>
                          {nft.displayName} <span>({getNFTTotal(alias)})</span>
                        </>
                      }
                      onClick={() => history.push(`/nft-details?category=${alias}`)}
                    />
                  );
                })
            ) : (
              <DivFlex justifyContent="center" marginTop="80px" style={{ width: '100%' }}>
                <SecondaryLabel>{t('nft.noOwned')}</SecondaryLabel>
              </DivFlex>
            )}
          </NftContainer>
        </>
      )}
    </NftPageContainer>
  );
};

export default Nft;
