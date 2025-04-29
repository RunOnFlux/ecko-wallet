import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Html5Qrcode } from 'html5-qrcode';
import { get } from 'lodash';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { BaseTextInput, InputError } from 'src/baseComponent';
import Button from 'src/components/Buttons';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { useModalContext } from 'src/contexts/ModalContext';
import images from 'src/images';
import { shortenAddress, convertContacts } from 'src/utils';
import { PageConfirm, InfoWrapper } from 'src/pages/SendTransactions/views/style';
import { useHistory } from 'react-router-dom';
import { useWindowResizeMobile } from 'src/hooks/useWindowResizeMobile';
import { hideLoading, setContacts, showLoading } from 'src/stores/slices/extensions';
import { fetchLocal } from 'src/utils/chainweb';
import { getLocalContacts, setLocalContacts } from 'src/utils/storage';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { DivFlex } from 'src/components';
import { BodyModal, TitleModal, DivChild, DivError, DivChildButton, ItemWrapperContact } from './style';
import { useAppSelector } from 'src/stores/hooks';

const QrReaderContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: auto;
  #qr-reader {
    width: 100% !important;
    video {
      width: 100% !important;
      border-radius: 8px;
    }
  }
`;

type Props = {
  contact?: any;
  networkId: any;
  isNew?: boolean;
};

const ContactForm = (props: Props) => {
  const { t } = useTranslation();
  const { contact, networkId, isNew } = props;
  const { closeModal } = useModalContext();
  const [isMobile] = useWindowResizeMobile(420);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const [isScanAccountName, setIsScanAccountName] = useState(false);
  const [aliasState, setAliasState] = useState(contact?.aliasName ?? '');
  const history = useHistory();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      alias: contact?.aliasName ?? '',
      accountName: contact?.accountName ?? '',
    },
  });

  useEffect(() => {
    let qrScanner: Html5Qrcode | null = null;

    if (isScanAccountName) {
      const scanner = new Html5Qrcode('qr-reader');
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 1, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (decodedText) {
              handleScanAccountName(decodedText);
              setIsScanAccountName(false);
            }
          },
          (error) => {
            if (!error.includes('QR code parse error')) {
              console.error(error);
              if (isMobile) {
                (window as any)?.chrome?.tabs?.create({ url: `/index.html#${history?.location?.pathname}` });
              }
            }
          },
        )
        .catch(console.error);

      qrScanner = scanner;
    }

    return () => {
      if (qrScanner) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, [isScanAccountName]);

  const finishAddContact = (addContact) => {
    const aliasName = getValues('alias').trim();
    const newContact = {
      aliasName,
      accountName: addContact.accountName,
      chainId: 0,
      pred: addContact.pred,
      keys: addContact.keys,
    };

    getLocalContacts(
      networkId,
      (data) => {
        const contacts = data;
        contacts[`${0}`] = contacts[`${0}`] || {};
        contacts[`${0}`][`${addContact.accountName}`] = newContact;
        setLocalContacts(networkId, contacts);
        setContacts(convertContacts(contacts));
        setAliasState('');
        closeModal();
        toast.success(<Toast type="success" content={t('settings.contactForm.successContactAdded')} />);
      },
      () => {
        const contacts = {};
        contacts[`${0}`] = {};
        contacts[`${0}`][`${addContact.accountName}`] = newContact;
        setLocalContacts(networkId, contacts);
        setContacts(convertContacts(contacts));
        toast.success(<Toast type="success" content={t('settings.contactForm.successContactAdded')} />);
        setAliasState('');
        closeModal();
      },
    );
  };

  const checkAddContact = () => {
    const { accountName, alias } = getValues();
    if (accountName && alias) {
      if (contact?.accountName) {
        finishAddContact(contact);
      } else {
        const pactCode = `(coin.details "${accountName}")`;
        showLoading();
        fetchLocal(pactCode, selectedNetwork.url, selectedNetwork.networkId, 0)
          .then((request) => {
            hideLoading();
            const newContact = {
              accountName,
              aliasName: alias,
              chainId: 0,
              pred: get(request, 'result.data.guard.pred'),
              keys: get(request, 'result.data.guard.keys'),
            };
            finishAddContact(newContact);
          })
          .catch(() => {
            hideLoading();
            toast.error(<Toast type="fail" content={t('settings.contactForm.errorNetwork')} />);
          });
      }
    }
  };

  const handleChangeAliasName = (e) => {
    clearErrors('alias');
    setAliasState(e.target.value);
    setValue('alias', e.target.value);
  };

  const handleScanAccountName = (data) => {
    if (data) {
      setValue('accountName', data, { shouldValidate: true });
      setIsScanAccountName(false);
    }
  };

  const copyToClipboard = (value) => {
    navigator.clipboard.writeText(value);
    toast.success(<Toast type="success" content={t('settings.contactForm.copied')} />);
  };

  return (
    <PageConfirm>
      <InfoWrapper>
        <form onSubmit={handleSubmit(checkAddContact)} id="contact-form">
          <ItemWrapperContact>
            <BaseTextInput
              inputProps={{
                placeholder: t('settings.contactForm.aliasPlaceholder'),
                ...register('alias', {
                  required: {
                    value: true,
                    message: t('settings.contactForm.requiredField'),
                  },
                  validate: {
                    required: (val) => val.trim().length > 0 || t('settings.contactForm.invalidData'),
                  },
                  maxLength: {
                    value: 256,
                    message: t('settings.contactForm.aliasMaxLength'),
                  },
                }),
                value: aliasState,
              }}
              onChange={handleChangeAliasName}
              title={t('settings.contactForm.enterAlias')}
              height="auto"
              onBlur={(e) => {
                setValue('alias', e.target.value.trim());
                handleChangeAliasName(e);
              }}
            />
          </ItemWrapperContact>
          <DivError>{errors.alias && <InputError marginTop="0">{errors.alias.message}</InputError>}</DivError>

          <ItemWrapperContact>
            {!isNew ? (
              <BaseTextInput
                inputProps={{
                  readOnly: true,
                  value: shortenAddress(contact?.accountName ?? ''),
                }}
                title={t('settings.contactForm.accountNameTitle')}
                height="auto"
                image={{
                  width: '15px',
                  height: '15px',
                  src: images.wallet.copyGray,
                  callback: () => copyToClipboard(contact?.accountName ?? ''),
                }}
              />
            ) : (
              <>
                <BaseTextInput
                  inputProps={{
                    placeholder: t('settings.contactForm.accountNamePlaceholder'),
                    ...register('accountName', {
                      required: {
                        value: true,
                        message: t('settings.contactForm.requiredField'),
                      },
                      validate: {
                        required: (val) => val.trim().length > 0 || t('settings.contactForm.invalidData'),
                      },
                      maxLength: {
                        value: 1000,
                        message: t('settings.contactForm.accountNameMaxLength'),
                      },
                    }),
                  }}
                  title={t('settings.contactForm.accountNameTitle')}
                  height="auto"
                  image={{
                    width: '20px',
                    height: '20px',
                    src: images.initPage.qrcode,
                    callback: () => setIsScanAccountName(true),
                  }}
                  onChange={(e) => {
                    clearErrors('accountName');
                    setValue('accountName', e.target.value);
                  }}
                />
                <DivError>{errors.accountName && <InputError marginTop="0">{errors.accountName.message}</InputError>}</DivError>
              </>
            )}
          </ItemWrapperContact>
        </form>

        {isScanAccountName && (
          <ModalCustom isOpen={isScanAccountName} onCloseModal={() => setIsScanAccountName(false)}>
            <BodyModal>
              <TitleModal>{t('settings.contactForm.scanQrTitle')}</TitleModal>
              <QrReaderContainer>
                <div id="qr-reader" />
              </QrReaderContainer>
              <DivChild>{t('settings.contactForm.scanQrDescription')}</DivChild>
            </BodyModal>
          </ModalCustom>
        )}
      </InfoWrapper>

      <DivChildButton>
        <DivFlex justifyContent="space-between" alignItems="center" gap="10px" padding="10px">
          <Button label={t('settings.contactForm.buttonCancel')} size="full" variant="disabled" onClick={() => closeModal()} />
          <Button type="submit" label={t('settings.contactForm.buttonSave')} size="full" form="contact-form" />
        </DivFlex>
      </DivChildButton>
    </PageConfirm>
  );
};

export default ContactForm;
