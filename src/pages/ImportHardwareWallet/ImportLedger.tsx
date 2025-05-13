import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Button from 'src/components/Buttons';
import { useHistory } from 'react-router-dom';
import { DivFlex, PageWrapper, SecondaryLabel } from 'src/components';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { hideLoading, setActiveTab, showLoading } from 'src/stores/slices/extensions';
import { fetchLocal } from 'src/utils/chainweb';
import { getLocalPassword, getLocalWallets, setLocalSelectedWallet, setLocalWallets } from 'src/utils/storage';
import { find, isEmpty } from 'lodash';
import { encryptKey } from 'src/utils/security';
import { AccountType, setCurrentWallet, setWallets } from 'src/stores/slices/wallet';
import { ACTIVE_TAB } from 'src/utils/constant';
import { useLedgerContext } from 'src/contexts/LedgerContext';
import { useAppSelector } from 'src/stores/hooks';

const ImportLedger = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [ledgerPublicKey, setLedgerPublicKey] = useState<string>('');
  const { wallets } = useAppSelector((state) => state.wallet);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const { getPublicKey, error } = useLedgerContext();

  const getLedgerAccount = async () => {
    try {
      const publicKey = await getPublicKey();
      setLedgerPublicKey(publicKey ?? '');
      const accountName = `k:${publicKey}`;
      const pactCode = `(coin.details "${accountName}")`;
      showLoading();
      fetchLocal(pactCode, selectedNetwork.url, selectedNetwork.networkId, 0)
        .then(() => hideLoading())
        .catch(() => {
          hideLoading();
          toast.error(<Toast type="fail" content={t('ledger.import.error.network')} />);
        });
    } catch (err: any) {
      console.error('Ledger ERROR:', err);
    }
  };

  const importAccountFromLedger = () => {
    const accountName = `k:${ledgerPublicKey}`;
    try {
      const pactCode = `(coin.details "${accountName}")`;
      showLoading();
      fetchLocal(pactCode, selectedNetwork.url, selectedNetwork.networkId, 0)
        .then(() => {
          hideLoading();
          getLocalPassword(
            (accountPassword) => {
              const isDuplicate = !isEmpty(find(wallets, (e) => Number(e.chainId) === 0 && e.account === accountName));
              if (!isDuplicate) {
                const wallet = {
                  account: encryptKey(accountName, accountPassword),
                  publicKey: encryptKey(ledgerPublicKey, accountPassword),
                  secretKey: '',
                  chainId: '0',
                  connectedSites: [],
                  type: 'LEDGER',
                };
                getLocalWallets(
                  selectedNetwork.networkId,
                  (item) => setLocalWallets(selectedNetwork.networkId, [...item, wallet]),
                  () => setLocalWallets(selectedNetwork.networkId, [wallet]),
                );
                const newWallet = {
                  chainId: 0,
                  account: accountName,
                  publicKey: ledgerPublicKey,
                  secretKey: '',
                  type: AccountType.LEDGER,
                  connectedSites: [],
                };
                setWallets([...wallets, newWallet]);
                setLocalSelectedWallet(wallet);
                setCurrentWallet(newWallet);
                toast.success(<Toast type="success" content={t('ledger.import.success')} />);
                history.push('/');
                setActiveTab(ACTIVE_TAB.HOME);
              } else {
                toast.error(<Toast type="fail" content={t('ledger.import.error.duplicate')} />);
              }
            },
            () => {},
          );
        })
        .catch(() => {
          hideLoading();
          toast.error(<Toast type="fail" content={t('ledger.import.error.network')} />);
        });
    } catch {
      toast.error(<Toast type="fail" content={t('ledger.import.error.invalid')} />);
    }
  };

  return (
    <PageWrapper>
      <NavigationHeader title={t('ledger.import.title')} onBack={() => history.push('/')} />
      <DivFlex>
        <SecondaryLabel>{t('ledger.import.instruction')}</SecondaryLabel>
      </DivFlex>
      <DivFlex>
        <Button size="full" label={t('ledger.import.continue')} variant="disabled" onClick={getLedgerAccount} />
      </DivFlex>
      <DivFlex flexDirection="column">
        <SecondaryLabel>{t('ledger.import.publicKey')}</SecondaryLabel>
        <SecondaryLabel>{ledgerPublicKey}</SecondaryLabel>
      </DivFlex>
      <DivFlex flexDirection="column">
        <SecondaryLabel>{t('ledger.import.account')}</SecondaryLabel>
        <SecondaryLabel>{`k:${ledgerPublicKey}`}</SecondaryLabel>
      </DivFlex>
      <DivFlex flexDirection="column">
        <SecondaryLabel color="red">{error}</SecondaryLabel>
      </DivFlex>
      {ledgerPublicKey && (
        <DivFlex>
          <Button size="full" label={t('ledger.import.confirm')} variant="primary" onClick={importAccountFromLedger} />
        </DivFlex>
      )}
    </PageWrapper>
  );
};

export default ImportLedger;
