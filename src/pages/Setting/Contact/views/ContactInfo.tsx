import { useState } from 'react';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { CommonLabel, DivFlex, SecondaryLabel } from 'src/components';
import { ActionList } from 'src/components/ActionList';
import Button from 'src/components/Buttons';
import ModalCustom from 'src/components/Modal/ModalCustom';
import Toast from 'src/components/Toast/Toast';
import { useModalContext } from 'src/contexts/ModalContext';
import images from 'src/images';
import { Icon, ReceiveSection, ReceiveTitle } from 'src/pages/Wallet/views/ReceiveModal';
import { setContacts } from 'src/stores/slices/extensions';
import { convertContacts } from 'src/utils';
import { getLocalContacts, setLocalContacts } from 'src/utils/storage';
import ContactForm from './ContactForm';
import { useAppSelector } from 'src/stores/hooks';

export const ContactInfo = ({ contact }: any) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const { openModal, closeModal } = useModalContext();

  const copyToClipboard = (value) => {
    navigator.clipboard.writeText(value);
    toast.success(<Toast type="success" content={t('settings.contactInfo.copied')} />);
  };

  const handleRemoveContact = () => {
    getLocalContacts(
      selectedNetwork.networkId,
      (data) => {
        const newContacts = data;
        delete newContacts[0][`${contact.accountName}`];
        setLocalContacts(selectedNetwork.networkId, newContacts);
        setContacts(convertContacts(newContacts));
        setIsDeleting(false);
        toast.success(<Toast type="success" content={t('settings.contactInfo.contactRemoved')} />);
        closeModal();
      },
      () => {},
    );
  };

  return (
    <>
      <div style={{ padding: 24 }}>
        <DivFlex justifyContent="space-between" alignItems="center" style={{ marginBottom: 20 }}>
          <ReceiveTitle fontWeight={700} fontSize={10}>
            {t('settings.contactInfo.accountName')}
          </ReceiveTitle>
          <Icon src={images.wallet.copyGray} onClick={() => copyToClipboard(contact.accountName)} />
        </DivFlex>
        <DivFlex justifyContent="flex-start" alignItems="flex-start">
          <Jazzicon diameter={24} seed={jsNumberForAddress(contact.accountName)} paperStyles={{ marginRight: 5, minWidth: 24 }} />
          <CommonLabel wordBreak="break-word">{contact.accountName}</CommonLabel>
        </DivFlex>
      </div>

      <ReceiveSection flexDirection="column" padding="0 24px">
        <ActionList
          actions={[
            {
              label: t('settings.contactInfo.editContact'),
              src: images.settings.iconEdit,
              onClick: () =>
                openModal({
                  title: `${t('settings.contactInfo.editTitle')} ${contact.aliasName}`,
                  content: <ContactForm networkId={selectedNetwork.networkId} contact={contact} />,
                }),
            },
            {
              label: t('settings.contactInfo.delete'),
              src: images.settings.iconTrash,
              onClick: () => setIsDeleting(true),
            },
          ]}
        />
        {isDeleting && (
          <ModalCustom isOpen={isDeleting} showCloseIcon={false} title={t('settings.contactInfo.deleteContactTitle')}>
            <div>
              <DivFlex flexDirection="column" justifyContent="center" alignItems="center" padding="24px">
                <CommonLabel fontSize={18} fontWeight={700}>
                  {t('settings.contactInfo.removeContact')}
                </CommonLabel>
                <SecondaryLabel fontWeight={400} fontSize={14} style={{ textAlign: 'center', margin: '20px 0' }}>
                  {t('settings.contactInfo.confirmRemove')}
                </SecondaryLabel>
              </DivFlex>
              <DivFlex justifyContent="space-between" alignItems="center" gap="10px" padding="24px">
                <Button size="full" label={t('settings.contactInfo.cancel')} variant="disabled" onClick={() => setIsDeleting(false)} />
                <Button size="full" label={t('settings.contactInfo.confirm')} variant="primary" onClick={handleRemoveContact} />
              </DivFlex>
            </div>
          </ModalCustom>
        )}
      </ReceiveSection>
    </>
  );
};
