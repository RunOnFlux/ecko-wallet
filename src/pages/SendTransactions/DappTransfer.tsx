import React from 'react';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { getLocalDapps } from 'src/utils/storage';
import { CommonLabel, DivFlex, SecondaryLabel } from 'src/components';
import { get } from 'lodash';
import { fetchLocal } from 'src/utils/chainweb';
import { hideLoading, showLoading } from 'src/stores/slices/extensions';
import images from 'src/images';
import Button from 'src/components/Buttons';
import Transfer from './views/Transfer';
import { DappContentWrapper, DappLogo, DappWrapper } from '../Dapps/SignedCmd';
import { useAppSelector } from 'src/stores/hooks';

const NotFound = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

export const PageSendTransaction = styled.div`
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  margin-bottom: 14px;
  overflow-y: scroll;
  overflow-x: hidden;
  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-track {
    background: rgb(226, 226, 226);
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgb(54, 54, 54);
    border-radius: 2px;
  }
`;

const DappTransfer = () => {
  const { t } = useTranslation();
  const [destinationAccount, setDestinationAccount] = useState<any>();
  const [loading, setLoading] = useState(true);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);

  useEffect(() => {
    getLocalDapps(
      (dapps) => {
        const { account, chainId, sourceChainId } = dapps;
        const pactCode = `(coin.details "${account}")`;
        showLoading();
        fetchLocal(pactCode, selectedNetwork.url, selectedNetwork.networkId, chainId)
          .then((res) => {
            const status = get(res, 'result.status');
            const exist = status === 'success';
            const pred = get(res, 'result.data.guard.pred');
            const keys = get(res, 'result.data.guard.keys');
            const newDestinationAccount = exist
              ? { accountName: account, sourceChainId, chainId, pred, keys, domain: dapps.domain, dappAmount: dapps.amount }
              : {};
            setDestinationAccount(newDestinationAccount);
            hideLoading();
            setLoading(false);
          })
          .catch(() => {
            hideLoading();
            setLoading(false);
          });
      },
      () => setLoading(false),
    );
  }, [selectedNetwork]);

  return (
    <DappWrapper>
      {!loading && (
        <>
          <DappLogo src={images.eckoWalletLogoRounded} alt={t('dappTransfer.logoAlt')} />
          <SecondaryLabel style={{ textAlign: 'center' }} uppercase>
            {selectedNetwork.networkId}
          </SecondaryLabel>
          <DappContentWrapper>
            {destinationAccount?.accountName ? (
              <>
                <DivFlex flexDirection="column" alignItems="center" justifyContent="center" margin="10px 0px">
                  <CommonLabel uppercase fontSize={24} fontWeight="bold" isSendCommonLabel>
                    {t('dappTransfer.sendTransaction')}
                  </CommonLabel>
                  <SecondaryLabel>{destinationAccount.domain}</SecondaryLabel>
                </DivFlex>
                <Transfer
                  isDappTransfer
                  sourceChainId={destinationAccount.sourceChainId}
                  destinationAccount={destinationAccount}
                  fungibleToken={{ symbol: 'kda', contractAddress: 'coin' }}
                />
              </>
            ) : (
              <NotFound>
                <CommonLabel style={{ marginBottom: 20, marginTop: 40 }}>{t('dappTransfer.destinationNotFound')}</CommonLabel>
                <Button variant="primary" size="full" label={t('common.close')} onClick={() => window.close()} />
              </NotFound>
            )}
          </DappContentWrapper>
        </>
      )}
    </DappWrapper>
  );
};

export default DappTransfer;
