import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import styled from 'styled-components';
import { useForm, Controller } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { find, isEmpty, get } from 'lodash';
import Pact from 'pact-lang-api';
import { useTranslation } from 'react-i18next';
import { BaseTextInput, BaseSelect, InputError } from 'src/baseComponent';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { hideLoading, showLoading } from 'src/stores/slices/extensions';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import images from 'src/images';
import { ActionFooter, PageWrapper } from 'src/components';
import { setCurrentWallet, setWallets } from 'src/stores/slices/wallet';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Button from 'src/components/Buttons';
import { useWindowResizeMobile } from 'src/hooks/useWindowResizeMobile';
import useChainIdOptions from 'src/hooks/useChainIdOptions';
import { useGoHome } from 'src/hooks/ui';
import { encryptKey } from 'src/utils/security';
import { getLocalPassword, getLocalWallets, setLocalSelectedWallet, setLocalWallets } from 'src/utils/storage';
import { fetchLocal } from '../../utils/chainweb';
import { useAppSelector } from 'src/stores/hooks';

const DivBody = styled.div`
  width: 100%;
  text-align: left;
  font-size: 20px;
  display: flex;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
`;

const Body = styled.div`
  height: auto;
  width: 100%;
`;

const DivChild = styled.div`
  margin: 20px 0px;
  text-align: center;
  color: ${({ theme }) => theme.text.primary};
`;

const TitleModal = styled.div`
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  padding: 15px 0px;
  color: ${({ theme }) => theme.text.primary};
`;

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

const ImportAccount = () => {
  const { t } = useTranslation();
  const optionsChain = useChainIdOptions();
  const history = useHistory();
  const goHome = useGoHome();
  const [isMobile] = useWindowResizeMobile(420);
  const { wallets, account } = useAppSelector((state) => state.wallet);
  const { selectedNetwork, isLoading } = useAppSelector((state) => state.extensions);
  const [isScanAccount, setScanAccount] = useState(false);
  const [isScanPrivateKey, setScanPrivateKey] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    clearErrors,
    getValues,
  } = useForm();

  const initQRScanner = (onSuccessCallback: (decoded: string) => void) => {
    const html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 1, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onSuccessCallback(decodedText);
          html5QrCode.stop();
        },
        () => {
          if (isMobile) {
            (window as any)?.chrome?.tabs?.create({
              url: `/index.html#${history.location.pathname}`,
            });
          }
        },
      )
      .catch(() => {
        /* ignore */
      });
  };

  useEffect(() => {
    if (isScanAccount) initQRScanner(handleScanAccount);
  }, [isScanAccount]);

  useEffect(() => {
    if (isScanPrivateKey) initQRScanner(handleScanPrivateKey);
  }, [isScanPrivateKey]);

  const onImport = async (data) => {
    if (isLoading) return;
    const { chainId, accountName, secretKey } = data;

    try {
      const { publicKey } = Pact.crypto.restoreKeyPairFromSecretKey(secretKey);
      const pactCode = `(coin.details "${accountName}")`;

      showLoading();
      fetchLocal(pactCode, selectedNetwork.url, selectedNetwork.networkId, chainId.value)
        .then((request) => {
          hideLoading();
          const keySets = get(request, 'result.data.guard.keys');
          const publicKeyOnChain = get(request, 'result.data.guard.keys[0]');
          const status = get(request, 'result.status');
          const notFound =
            request?.result?.error?.message?.startsWith('with-read: row not found:') ||
            request.result?.error?.message?.startsWith('No value found in table');

          if ((keySets && keySets.length === 1) || notFound) {
            if (notFound || publicKeyOnChain === publicKey) {
              getLocalPassword(
                (pwd) => {
                  const exists = !isEmpty(find(wallets, (w) => w.chainId === chainId.value && w.account === accountName));
                  if (!exists) {
                    const enc = (s) => encryptKey(s, pwd);
                    const newWallet = {
                      account: enc(accountName),
                      publicKey: enc(publicKey),
                      secretKey: enc(secretKey),
                      chainId: chainId.value,
                      connectedSites: [],
                    };

                    getLocalWallets(
                      selectedNetwork.networkId,
                      (list) => {
                        setLocalWallets(selectedNetwork.networkId, [...list, newWallet]);
                      },
                      () => {
                        setLocalWallets(selectedNetwork.networkId, [newWallet]);
                      },
                    );

                    const stateWallet = {
                      account: accountName,
                      publicKey,
                      secretKey,
                      chainId: chainId.value,
                      connectedSites: [],
                    };

                    setWallets([...wallets, stateWallet]);
                    setLocalSelectedWallet(newWallet);
                    setCurrentWallet(stateWallet);

                    toast.success(<Toast type="success" content={t('importWallet.toast.importSuccess')} />);
                    goHome();
                  } else {
                    toast.error(<Toast type="fail" content={t('importWallet.toast.duplicateError')} />);
                  }
                },
                () => {},
              );
            } else {
              toast.error(<Toast type="fail" content={t('importWallet.toast.invalidAccountData')} />);
            }
          } else if (status === 'success') {
            toast.error(<Toast type="fail" content={t('importWallet.toast.multipleKeys')} />);
          } else {
            toast.error(<Toast type="fail" content={t('importWallet.toast.invalidData')} />);
          }
        })
        .catch(() => {
          hideLoading();
          toast.error(<Toast type="fail" content={t('importWallet.toast.networkError')} />);
        });
    } catch {
      toast.error(<Toast type="fail" content={t('importWallet.toast.invalidData')} />);
    }
  };

  const goBack = () => {
    if (account) history.push(history.location.state?.from || '/');
    else history.push('/init');
  };

  const handleScanAccount = (data: string) => {
    setValue('accountName', data.trim(), { shouldValidate: true });
    setScanAccount(false);
  };

  const handleScanPrivateKey = (data: string) => {
    setValue('secretKey', data.trim(), { shouldValidate: true });
    setScanPrivateKey(false);
  };

  return (
    <PageWrapper>
      <NavigationHeader title={t('importWallet.header')} onBack={goBack} />
      <Body>
        <form onSubmit={handleSubmit(onImport)} id="import-wallet-form">
          <DivBody>
            <BaseTextInput
              inputProps={{
                placeholder: t('importWallet.form.accountName.placeholder'),
                ...register('accountName', {
                  required: { value: true, message: t('importWallet.validation.required') },
                  validate: {
                    required: (v) => v.trim().length > 0 || t('importWallet.validation.invalidData'),
                    startsWithK: (v) => v.startsWith('k:') || t('importWallet.validation.startsWithK'),
                  },
                  maxLength: {
                    value: 1000,
                    message: t('importWallet.validation.accountName.maxLength'),
                  },
                }),
              }}
              title={t('importWallet.form.accountName.title')}
              height="auto"
              image={{
                width: '20px',
                height: '20px',
                src: images.initPage.qrcode,
                callback: () => setScanAccount(true),
              }}
              onChange={(e) => {
                clearErrors('accountName');
                setValue('accountName', e.target.value);
              }}
            />
            {errors.accountName && <InputError>{errors.accountName.message}</InputError>}
          </DivBody>

          <DivBody>
            <Controller
              control={control}
              name="chainId"
              rules={{ required: { value: true, message: t('importWallet.validation.required') } }}
              render={({ field }) => (
                <BaseSelect selectProps={field} options={optionsChain} title={t('importWallet.form.chainId.title')} height="auto" />
              )}
            />
            {errors.chainId && !getValues('chainId') && <InputError>{errors.chainId.message}</InputError>}
          </DivBody>

          <DivBody>
            <BaseTextInput
              inputProps={{
                placeholder: t('importWallet.form.secretKey.placeholder'),
                ...register('secretKey', {
                  required: { value: true, message: t('importWallet.validation.required') },
                  validate: {
                    required: (v) => v.trim().length > 0 || t('importWallet.validation.invalidData'),
                  },
                  maxLength: {
                    value: 1000,
                    message: t('importWallet.validation.secretKey.maxLength'),
                  },
                }),
              }}
              title={t('importWallet.form.secretKey.title')}
              height="auto"
              image={{
                width: '20px',
                height: '20px',
                src: images.initPage.qrcode,
                callback: () => setScanPrivateKey(true),
              }}
              onChange={(e) => {
                clearErrors('secretKey');
                setValue('secretKey', e.target.value);
              }}
              onBlur={(e) => setValue('secretKey', e.target.value.trim())}
            />
            {errors.secretKey && <InputError>{errors.secretKey.message}</InputError>}
          </DivBody>
        </form>
      </Body>

      {isScanAccount && (
        <ModalCustom isOpen onCloseModal={() => setScanAccount(false)}>
          <Body>
            <TitleModal>{t('importWallet.modal.scanTitle')}</TitleModal>
            <QrReaderContainer>
              <div id="qr-reader" />
            </QrReaderContainer>
            <DivChild>{t('importWallet.modal.scanBody')}</DivChild>
          </Body>
        </ModalCustom>
      )}

      {isScanPrivateKey && (
        <ModalCustom isOpen onCloseModal={() => setScanPrivateKey(false)}>
          <Body>
            <TitleModal>{t('importWallet.modal.scanTitle')}</TitleModal>
            <QrReaderContainer>
              <div id="qr-reader" />
            </QrReaderContainer>
            <DivChild>{t('importWallet.modal.scanBody')}</DivChild>
          </Body>
        </ModalCustom>
      )}

      <ActionFooter>
        <Button label={t('importWallet.button.import')} size="full" form="import-wallet-form" />
      </ActionFooter>
    </PageWrapper>
  );
};

export default ImportAccount;
