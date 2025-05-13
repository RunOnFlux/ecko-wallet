import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import images from 'src/images';
import { ActionList } from 'src/components/ActionList';
import { DivFlex } from 'src/components';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import { ModalContext } from 'src/contexts/ModalContext';
import { AliasModal } from '../modals/AliasModal';
import { HashSignModal } from '../modals/HashSignModal';
import { useAppSelector } from 'src/stores/hooks';

export const DoubleFooter = styled.div`
  margin: -1rem;
  padding: 1rem;
`;

export const AccountActions = ({
  onCreateAccount,
  onImportAccount,
  onImportFromLedger,
  onRemoveWallet,
}: {
  onCreateAccount: any;
  onImportAccount: any;
  onImportFromLedger: any;
  onRemoveWallet: any;
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const stateWallet = useCurrentWallet();
  const { openModal } = useContext(ModalContext);
  const { wallets } = useAppSelector((state) => state.wallet);

  const onActionClick = (clb) => {
    clb();
  };

  const actions = [
    {
      src: images.settings.iconShare,
      label: t('accountActions.shareWallet'),
      onClick: () => {
        navigator.clipboard.writeText(stateWallet?.account);
        toast.success(<Toast type="success" content={t('accountActions.copied')} />);
      },
    },
    {
      src: images.settings.iconShare,
      label: t('accountActions.exportRecoveryPhrase'),
      onClick: () => onActionClick(history.push('/export-seed-phrase')),
    },
    {
      src: images.settings.iconSignHash,
      label: t('accountActions.signHashTransaction'),
      onClick: () => openModal({ title: t('accountActions.signHashTransaction'), content: <HashSignModal /> }),
      style: { marginLeft: -2, marginRight: 10, width: 22 },
    },
    {
      src: images.settings.iconEdit,
      label: t('accountActions.editAccountAlias'),
      onClick: () => openModal({ title: t('accountActions.setAccountAlias'), content: <AliasModal /> }),
      style: { marginLeft: -2, marginRight: 10, width: 22 },
    },
  ];

  if (wallets?.length > 1) {
    actions.push({
      src: images.settings.iconTrash,
      label: t('accountActions.removeSelectedWallet'),
      onClick: onRemoveWallet,
    });
  }

  return (
    <>
      <DoubleFooter style={{ padding: '1rem 1rem 2rem 1rem' }}>
        <DivFlex flexDirection="column">
          <ActionList actions={actions} />
        </DivFlex>
      </DoubleFooter>
      <DoubleFooter style={{ borderTop: '1px solid #dfdfed' }}>
        <DivFlex flexDirection="column">
          <ActionList
            actions={[
              { label: t('accountActions.createWallet'), onClick: () => onActionClick(onCreateAccount) },
              { label: t('accountActions.importWallet'), onClick: () => onActionClick(onImportAccount) },
              { label: t('accountActions.importHardwareWallet'), onClick: () => onActionClick(onImportFromLedger) },
            ]}
          />
        </DivFlex>
      </DoubleFooter>
    </>
  );
};
