import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setWallets } from 'src/stores/slices/wallet';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import { decryptKey } from 'src/utils/security';
import { getLocalWallets, setLocalWallets } from 'src/utils/storage';
import { BaseTextInput } from 'src/baseComponent';
import Button from 'src/components/Buttons';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { DivFlex } from 'src/components';
import { useModalContext } from 'src/contexts/ModalContext';
import { useAppSelector } from 'src/stores/hooks';

export const AliasModal = () => {
  const { t } = useTranslation();
  const stateWallet = useCurrentWallet();
  const { closeModal } = useModalContext();
  const { selectedNetwork, passwordHash } = useAppSelector((state) => state.extensions);
  const { wallets } = useAppSelector((state) => state.wallet);

  const [alias, setAlias] = useState('');

  const setAccountAlias = () => {
    getLocalWallets(
      selectedNetwork.networkId,
      (items) => {
        const selectedIndex = items.findIndex((a) => decryptKey(a.account, passwordHash) === stateWallet?.account);
        if (selectedIndex > -1) {
          items[selectedIndex].alias = alias;
        }
        setLocalWallets(selectedNetwork.networkId, items);
        const newWallets = [...wallets.filter((a) => a.account !== stateWallet?.account)];
        const selectedWalletIndex = wallets.findIndex((a) => a.account === stateWallet?.account);
        newWallets.splice(selectedWalletIndex, 0, { ...wallets[selectedWalletIndex], alias });
        setWallets(newWallets);
        toast.success(<Toast type="success" content={t('aliasModal.aliasChanged')} />);
      },
      () => {},
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <BaseTextInput
        inputProps={{ value: alias }}
        title={t('aliasModal.accountAlias')}
        height="auto"
        onChange={(e) => {
          if (e.target?.value?.length < 20) {
            setAlias(e.target.value);
          }
        }}
      />
      <DivFlex justifyContent="space-between" alignItems="center" gap="10px" padding="10px">
        <Button
          label={t('aliasModal.cancel')}
          size="full"
          variant="disabled"
          onClick={() => {
            setAlias('');
            closeModal();
          }}
        />
        <Button
          type="submit"
          label={t('aliasModal.save')}
          size="full"
          onClick={() => {
            setAccountAlias();
            closeModal();
            setAlias('');
          }}
        />
      </DivFlex>
    </div>
  );
};
