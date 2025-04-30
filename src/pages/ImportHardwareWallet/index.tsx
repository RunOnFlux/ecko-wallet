import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Button from 'src/components/Buttons';
import { useHistory } from 'react-router-dom';
import { DivFlex, PageWrapper, SecondaryLabel, StickyFooter } from 'src/components';
import LedgerLogo from 'src/images/ledger-logo-long.svg?react';
import LedgerIcon from 'src/images/ledger-logo.svg?react';
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
import { RadioSelection } from 'src/components/RadioSelection';
import { useAppSelector } from 'src/stores/hooks';

const HardwareButton = styled.div<{ isSelected: boolean }>`
  border-radius: 10px;
  height: 50px;
  width: 380px;
  text-align: center;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.button.secondary};
  background-color: ${({ isSelected, theme }) => (isSelected ? theme.button.secondary : 'none')};
  svg {
    path {
      fill: ${({ isSelected, theme }) => (isSelected ? 'white' : theme.button.secondary)};
    }
  }
`;

const ImportHardwareWallet = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [selectedHardwareWallet, setSelectedHardwareWallet] = useState<'ledger' | 'trezor' | null>(null);
  const [ledgerPublicKey, setLedgerPublicKey] = useState<string>('');
  const [selectedPublicKey, setSelectedPublicKey] = useState<string>('');
  const { wallets } = useAppSelector((state) => state.wallet);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const { getPublicKey } = useLedgerContext();

  const goBack = () => {
    history.push('/');
  };

  const getLedgerAccount = async () => {
    try {
      showLoading();
      const publicKey = await getPublicKey();
      setLedgerPublicKey(publicKey ?? '');
      hideLoading();
    } catch (err: any) {
      console.error('Ledger ERROR:', err);
      hideLoading();
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
              const alreadyExists = !isEmpty(find(wallets, (e) => Number(e.chainId) === 0 && e.account === accountName));
              if (!alreadyExists) {
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
                const newWalletState = {
                  chainId: 0,
                  account: accountName,
                  publicKey: ledgerPublicKey,
                  secretKey: '',
                  type: AccountType.LEDGER,
                  connectedSites: [],
                };
                const updatedWallets = [...wallets, newWalletState];
                setWallets(updatedWallets);
                setLocalSelectedWallet(wallet);
                setCurrentWallet(newWalletState);
                toast.success(<Toast type="success" content={t('hardware.import.success')} />);
                history.push('/');
                setActiveTab(ACTIVE_TAB.HOME);
              } else {
                toast.error(<Toast type="fail" content={t('hardware.import.error.duplicate')} />);
              }
            },
            () => {},
          );
        })
        .catch(() => {
          hideLoading();
          toast.error(<Toast type="fail" content={t('hardware.import.error.network')} />);
        });
    } catch {
      toast.error(<Toast type="fail" content={t('hardware.import.error.invalid')} />);
    }
  };

  const renderSelectHardwareWallet = () => (
    <>
      <DivFlex justifyContent="center" padding="22px 0">
        <SecondaryLabel>{t('hardware.import.selectDevice')}</SecondaryLabel>
      </DivFlex>
      <DivFlex flexDirection="column" gap="16px" alignItems="center">
        <HardwareButton isSelected={selectedHardwareWallet === 'ledger'} onClick={() => setSelectedHardwareWallet('ledger')}>
          <LedgerLogo style={{ marginTop: 13 }} />
        </HardwareButton>
      </DivFlex>
      {selectedHardwareWallet === 'ledger' && (
        <>
          <DivFlex justifyContent="center" padding="22px 0">
            <SecondaryLabel>{t('hardware.import.ledgerInstructions')}</SecondaryLabel>
          </DivFlex>
          <StickyFooter style={{ background: 'transparent', padding: '20px 0px' }}>
            <Button onClick={getLedgerAccount} label={t('hardware.import.connect')} size="full" style={{ width: '90%', maxWidth: 890 }} />
          </StickyFooter>
        </>
      )}
    </>
  );

  const renderSelectAccount = () => (
    <>
      <DivFlex
        justifyContent="flex-start"
        padding="24x"
        flexDirection="column"
        alignItems="flex-start"
        style={{
          margin: '0 -22px 40px -22px',
          borderTop: '1px solid #81878F',
          borderBottom: '1px solid #81878F',
          padding: 16,
          gap: 10,
        }}
      >
        <SecondaryLabel>DEVICE</SecondaryLabel>
        <DivFlex justifyContent="flex-start" padding="24x" alignItems="center" gap="10px">
          <LedgerIcon />
          <SecondaryLabel>Ledger Nano S</SecondaryLabel>
        </DivFlex>
      </DivFlex>
      <RadioSelection
        value={selectedPublicKey}
        options={[{ label: `k:${ledgerPublicKey}`, value: ledgerPublicKey }]}
        onChange={(pk) => {
          if (!pk) return;
          setSelectedPublicKey(pk);
        }}
      />
      {selectedPublicKey && (
        <StickyFooter style={{ background: 'transparent', padding: '20px 0px' }}>
          <Button onClick={importAccountFromLedger} label={t('hardware.import.confirm')} size="full" style={{ width: '90%', maxWidth: 890 }} />
        </StickyFooter>
      )}
    </>
  );

  return (
    <PageWrapper>
      <NavigationHeader title={t('hardware.import.title')} onBack={goBack} />
      {!ledgerPublicKey && renderSelectHardwareWallet()}
      {ledgerPublicKey && renderSelectAccount()}
    </PageWrapper>
  );
};

export default ImportHardwareWallet;
