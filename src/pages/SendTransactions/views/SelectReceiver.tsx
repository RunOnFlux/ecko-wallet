import { useState, useContext, useEffect, useRef } from 'react';
import { hideLoading, showLoading } from 'src/stores/slices/extensions';
import { extractDecimal, fetchListLocal } from 'src/utils/chainweb';
import { BaseSelect, BaseTextInput, BaseModalSelect, InputError } from 'src/baseComponent';
import { Controller, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import images from 'src/images';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import AlertIconSVG from 'src/images/icon-alert.svg?react';
import { SInput, SLabel } from 'src/baseComponent/BaseTextInput';
import Spinner from 'src/components/Spinner';
import { useModalContext } from 'src/contexts/ModalContext';
import { JazzAccount } from 'src/components/JazzAccount';
import { NON_TRANSFERABLE_TOKENS } from 'src/utils/constant';
import { useAccountBalanceContext } from 'src/contexts/AccountBalanceContext';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { SettingsContext } from 'src/contexts/SettingsContext';
import { useWindowResizeMobile } from 'src/hooks/useWindowResizeMobile';
import { useDebounce } from 'src/hooks/useDebounce';
import useChainIdOptions from 'src/hooks/useChainIdOptions';
import Toast from 'src/components/Toast/Toast';
import { humanReadableNumber, shortenAddress } from 'src/utils';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { get } from 'lodash';
import { CommonLabel, DivBottomShadow, DivFlex, SecondaryLabel, StickyFooter } from 'src/components';
import Button from 'src/components/Buttons';
import { IFungibleToken } from 'src/pages/ImportToken';
import { BodyModal, TitleModal, DivChild, InputWrapper, Warning } from '../styles';
import { KeyWrapper, KeyItemWrapper, KeyRemove, ContactSuggestion } from './style';
import { useAppSelector } from 'src/stores/hooks';
import { useTranslation } from 'react-i18next';

type Props = {
  goToTransfer: any;
  sourceChainId: any;
  fungibleToken: IFungibleToken | null;
};

const predList = [
  {
    label: 'All keys',
    value: 'keys-all',
  },
  {
    label: 'Any single key',
    value: 'keys-any',
  },
];

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

const SelectReceiver = ({ goToTransfer, sourceChainId, fungibleToken }: Props) => {
  const { t } = useTranslation();
  const { contacts, recent, selectedNetwork } = useAppSelector((state) => state.extensions);
  const sortedContacts = [...(contacts || [])]?.sort((a, b) => a?.aliasName?.localeCompare(b?.aliasName));
  const rootStateWallet = useAppSelector((state) => state.wallet);
  const history = useHistory();
  const optionsChain = useChainIdOptions();
  const { data: settings } = useContext(SettingsContext);
  const txSettings = settings?.txSettings;
  const { selectedAccountBalance, usdPrices } = useAccountBalanceContext();
  const { openModal, closeModal } = useModalContext();
  const { theme } = useAppThemeContext();

  const [isMobile] = useWindowResizeMobile(420);
  const [isSearching, setIsSearching] = useState(false);
  const [isScanSearching, setIsScanSearching] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [account, setAccount] = useState<any>({});
  const [pKeys, setPKeys] = useState<any>([]);
  const [isOpenContactSuggestion, setIsOpenContactSuggestion] = useState<boolean>(true);
  const [isLoadingKadenaName, setIsLoadingKadenaName] = useState<boolean>(false);
  const [convertedAccountName, setConvertedAccountName] = useState<string>('');

  const getSourceChainBalance = (chainId: number) => {
    if (selectedAccountBalance) {
      return selectedAccountBalance[chainId] && extractDecimal(selectedAccountBalance[chainId][fungibleToken?.contractAddress as any]);
    }
    return 0;
  };

  const [selectedChainBalance, setSelectedChainBalance] = useState(0);

  useEffect(() => {
    setSelectedChainBalance(getSourceChainBalance(sourceChainId));
  }, [fungibleToken?.contractAddress]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    clearErrors,
    getValues,
    setError,
  } = useForm({
    defaultValues: {
      accountName: '',
      chainId: { value: null, label: null },
      sourceChainId: !Number.isNaN(sourceChainId) ? { value: Number(sourceChainId), label: `Chain ${sourceChainId}` } : { label: null, value: null },
      pred: { label: null, value: null },
      publicKey: '',
    },
  });

  const destinationAccountInputRef = useRef<HTMLInputElement>(null);
  const rect = destinationAccountInputRef?.current?.getBoundingClientRect();

  const accountName = getValues('accountName');

  const debouncedAccountName = useDebounce(accountName, 500);

  useEffect(() => {
    if (debouncedAccountName?.endsWith('.kda')) {
      setIsLoadingKadenaName(true);
      fetch(`https://www.kadenanames.com/api/v1/address/${debouncedAccountName}`)
        .then(async (res) => {
          const data = await res.json();
          if (data?.address) {
            setConvertedAccountName(data.address);
          }
          setIsLoadingKadenaName(false);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(err);
          setIsLoadingKadenaName(false);
        });
    }
  }, [debouncedAccountName]);

  const onNext = () => {
    const receiver: string = convertedAccountName || getValues('accountName');
    const aliasName = receiver !== getValues('accountName') ? getValues('accountName') : null;
    const chainId: any = getValues('chainId')?.value;
    const sourceChainIdValue: any = getValues('sourceChainId')?.value;
    if (chainId === null) {
      setError('chainId', { type: 'required', message: 'Please select the Target Chain ID' });
      return;
    }
    const isDuplicated = receiver === rootStateWallet?.account && chainId.toString() === sourceChainIdValue.toString();
    if (isDuplicated) {
      toast.error(<Toast type="fail" content="Can not send to yourself" />);
    } else {
      showLoading();
      const prefix = fungibleToken?.contractAddress || 'coin';
      const code = `(${prefix}.details "${receiver}")`;
      fetchListLocal(code, selectedNetwork.url, selectedNetwork.networkId, chainId, txSettings?.gasPrice, txSettings?.gasLimit)
        .then((res) => {
          hideLoading();
          setIsSearching(false);
          const status = get(res, 'result.status');
          const exist = status === 'success';
          const pred = get(res, 'result.data.guard.pred');
          const keys = get(res, 'result.data.guard.keys');
          if (exist) {
            const destinationAccount = {
              accountName: receiver,
              aliasName,
              chainId,
              pred,
              keys,
              receiverExists: true,
            };
            goToTransferAccount(destinationAccount, sourceChainIdValue);
          } else if (receiver.startsWith('k:')) {
            const destinationAccount = {
              accountName: receiver,
              aliasName,
              chainId,
              pred: predList[0].value,
              keys: [receiver.substring(2)],
            };
            goToTransferAccount(destinationAccount, sourceChainIdValue);
          } else {
            setAccount({
              accountName: receiver,
              chainId,
            });
            openModal({
              title: 'Warning',
              content: (
                <DivFlex flexDirection="column" alignItems="center" justifyContent="space-evenly" padding="15px" style={{ textAlign: 'center' }}>
                  <CommonLabel fontWeight={600} fontSize={14}>
                    You are sending to a non “k:account”! <br /> <br /> Are you sure you want to proceed?
                  </CommonLabel>
                  <DivFlex gap="10px" style={{ width: '90%', marginTop: 40 }}>
                    <Button
                      onClick={() => {
                        setValue('accountName', '');
                        closeModal();
                      }}
                      variant="secondary"
                      label="Cancel"
                      size="full"
                    />
                    <Button
                      onClick={() => {
                        closeModal();
                        setIsOpenConfirmModal(true);
                      }}
                      label="Continue"
                      size="full"
                    />
                  </DivFlex>
                </DivFlex>
              ),
            });
          }
        })
        .catch(() => {
          toast.error(<Toast type="fail" content="Network error" />);
          hideLoading();
          setIsSearching(false);
        });
    }
  };

  useEffect(() => {
    let qrScanner: Html5Qrcode | null = null;

    if (isScanSearching) {
      const scanner = new Html5Qrcode('qr-reader');
      scanner
        .start(
          { facingMode: 'environment' },
          {
            fps: 1,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (decodedText) {
              handleScanSearching(decodedText);
              setIsScanSearching(false);
            }
          },
          (error) => {
            if (!error.includes('QR code parse error')) {
              console.error(error);
              if (isMobile) {
                (window as any)?.chrome?.tabs?.create({
                  url: `/index.html#${history?.location?.pathname}`,
                });
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
  }, [isScanSearching]);

  const goToTransferAccount = (destAccount, sourceChainIdValue) => {
    goToTransfer(destAccount, sourceChainIdValue);
    if (isOpenConfirmModal) {
      setIsOpenConfirmModal(false);
    }
  };

  const handleScanSearching = (data) => {
    if (data) {
      clearErrors('accountName');
      setValue('accountName', data);
      setIsScanSearching(false);
    }
  };

  const onAddPublicKey = () => {
    const publicKey = getValues('publicKey');
    if (publicKey.length === 64) {
      if (pKeys.includes(publicKey)) {
        setError('publicKey', { type: 'match', message: 'The public key already in list' });
      } else {
        const newPKeys = [...pKeys, publicKey];
        setPKeys(newPKeys);
        setValue('publicKey', '');
      }
    } else {
      setError('publicKey', { type: 'match', message: 'Key has unexpected length.' });
    }
  };

  const onRemoveKey = (key) => {
    const newKeys = pKeys.filter((k) => k !== key) || [];
    setPKeys(newKeys);
  };

  const renderKeys = () => (
    <KeyWrapper>
      <SecondaryLabel fontWeight={700}>KEYS</SecondaryLabel>
      {pKeys.map((key) => (
        <KeyItemWrapper key={key}>
          {key}
          <KeyRemove src={images.close} alt="remove" onClick={() => onRemoveKey(key)} />
        </KeyItemWrapper>
      ))}
    </KeyWrapper>
  );

  const getTabContent = (data, isRecent = false) =>
    data
      ?.filter((value, index, self) => index === self.findIndex((t) => t.accountName === value.accountName))
      .map((contact: any) => (
        <JazzAccount
          key={contact.accountName}
          account={contact.accountName}
          renderAccount={
            contact.aliasName &&
            ((acc) => (
              <DivFlex flexDirection="column">
                <CommonLabel color={theme.footer?.primary} fontWeight={700} fontSize={14}>
                  {contact.aliasName}
                </CommonLabel>
                <SecondaryLabel fontWeight={500}>{shortenAddress(acc)}</SecondaryLabel>
              </DivFlex>
            ))
          }
          onClick={() => {
            if (!isRecent) {
              setValue('accountName', contact.aliasName);
              setConvertedAccountName(contact.accountName);
            } else {
              setValue('accountName', contact.accountName);
              setConvertedAccountName('');
            }
            setIsOpenContactSuggestion(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ));

  const onCreateAccount = () => {
    if (errors.publicKey) return;
    const pred = getValues('pred').value;
    const publicKey = getValues('publicKey');
    let keys: any = [];
    if (pKeys.length > 0) {
      keys = pKeys;
    } else if (publicKey) {
      if (publicKey.length === 64) {
        keys = [publicKey];
      } else {
        setError('publicKey', { type: 'match', message: 'Key has unexpected length.' });
        return;
      }
    } else {
      setError('publicKey', { type: 'match', message: 'This field is required.' });
      return;
    }
    const newAccount = { ...account, pred, keys };
    setValue('publicKey', '');
    setPKeys([]);
    goToTransferAccount(newAccount, getValues('sourceChainId') && getValues('sourceChainId').value);
  };

  const isNonTransferable = NON_TRANSFERABLE_TOKENS.some((nonTransf) => nonTransf === fungibleToken?.contractAddress);
  return (
    <>
      <div>
        <form>
          {isNonTransferable && (
            <Warning type="danger" margin="-20px 0px 10px 0px">
              <AlertIconSVG />
              <div>
                <span>
                  {t('selectReceiver.notTransferable', {
                    contractAddress: fungibleToken?.contractAddress,
                  })}
                </span>
              </div>
            </Warning>
          )}
          <DivBottomShadow justifyContent="center" flexDirection="column" padding="20px" margin="0 -20px">
            <InputWrapper style={{ marginTop: 0 }}>
              <Controller
                control={control}
                name="sourceChainId"
                rules={{
                  required: {
                    value: true,
                    message: t('common.requiredField'),
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <BaseModalSelect
                    value={value}
                    onChange={(chain) => {
                      setSelectedChainBalance(getSourceChainBalance(chain.value));
                      onChange(chain);
                    }}
                    options={optionsChain}
                    title={t('selectReceiver.form.sourceChainId.title')}
                  />
                )}
              />
              {errors.sourceChainId && <InputError>{errors.sourceChainId.message}</InputError>}
            </InputWrapper>

            <InputWrapper>
              <SLabel uppercase>
                {t('selectReceiver.balanceLabel', {
                  symbol: fungibleToken?.symbol,
                })}
              </SLabel>
              <SInput value={selectedChainBalance} readOnly />
              {usdPrices && fungibleToken && usdPrices[fungibleToken.contractAddress] && (
                <SecondaryLabel>{humanReadableNumber(usdPrices[fungibleToken.contractAddress] * selectedChainBalance)} USD</SecondaryLabel>
              )}
            </InputWrapper>

            <InputWrapper
              ref={destinationAccountInputRef}
              style={{
                borderTop: '1px solid #DFDFED',
                paddingTop: 10,
                marginTop: 30,
                position: 'relative',
              }}
            >
              <BaseTextInput
                title={t('selectReceiver.form.destinationAccount.title')}
                subtitle={convertedAccountName}
                height="auto"
                inputProps={{
                  ...register('accountName', {
                    required: {
                      value: true,
                      message: t('common.requiredField'),
                    },
                    validate: {
                      required: (val) => val.trim().length > 0 || t('common.invalidData'),
                    },
                    maxLength: {
                      value: 1000,
                      message: t('selectReceiver.validation.maxDestinationAccount'),
                    },
                  }),
                }}
                image={{
                  width: '20px',
                  height: '20px',
                  marginTop: '25px',
                  src: images.initPage.qrcode,
                  callback: () => setIsScanSearching(true),
                }}
                imageComponent={
                  isLoadingKadenaName ? (
                    <Spinner size={10} color={theme.text?.primary} weight={2} style={{ top: 25, position: 'absolute', right: 10 }} />
                  ) : null
                }
                wrapperStyle={{
                  alignItems: 'flex-start',
                  height: 70,
                }}
                onChange={(e) => {
                  clearErrors('accountName');
                  setConvertedAccountName('');
                  setIsOpenContactSuggestion(true);
                  setValue('accountName', e.target.value);
                }}
              />
              {errors.accountName && <InputError>{errors.accountName.message}</InputError>}
              {isOpenContactSuggestion && accountName && (
                <ContactSuggestion style={{ width: rect?.width ? rect.width - 10 : '100%' }} className="lightScrollbar">
                  {getTabContent(sortedContacts?.filter((c) => c.aliasName?.toLowerCase().includes(accountName.toLowerCase())))}
                </ContactSuggestion>
              )}
            </InputWrapper>

            <InputWrapper>
              <Controller
                control={control}
                name="chainId"
                rules={{
                  required: {
                    value: true,
                    message: t('common.requiredField'),
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <BaseModalSelect value={value} onChange={onChange} options={optionsChain} title={t('selectReceiver.form.targetChainId.title')} />
                )}
              />
              {errors.chainId && <InputError>{errors.chainId.message}</InputError>}
            </InputWrapper>
          </DivBottomShadow>
        </form>
      </div>

      {isSearching ? (
        <div />
      ) : (
        <div style={{ margin: '30px 0 70px 0' }}>
          {recent.length > 0 && (
            <div>
              <SecondaryLabel>{t('selectReceiver.recent')}</SecondaryLabel>
              {getTabContent(recent.slice(0, 5), true)}
            </div>
          )}
          {contacts.length > 0 && (
            <div>
              <SecondaryLabel>{t('selectReceiver.contacts')}</SecondaryLabel>
              {getTabContent(sortedContacts)}
            </div>
          )}
        </div>
      )}

      <StickyFooter>
        <Button onClick={handleSubmit(onNext)} label={t('common.continue')} size="full" style={{ width: '90%', maxWidth: 890 }} />
      </StickyFooter>

      {isScanSearching && (
        <ModalCustom isOpen={isScanSearching} onCloseModal={() => setIsScanSearching(false)}>
          <BodyModal>
            <TitleModal>{t('importWallet.modal.scanTitle')}</TitleModal>
            <QrReaderContainer>
              <div id="qr-reader" />
            </QrReaderContainer>
            <DivChild>{t('importWallet.modal.scanBody')}</DivChild>
          </BodyModal>
        </ModalCustom>
      )}

      {isOpenConfirmModal && (
        <ModalCustom
          isOpen
          title={t('selectReceiver.confirm.warningTitle')}
          onCloseModal={() => setIsOpenConfirmModal(false)}
          closeOnOverlayClick={false}
        >
          <div style={{ padding: '0 24px' }}>
            {/* ... */}
            <BaseTextInput
              title={t('selectReceiver.confirm.publicKeyTitle')}
              inputProps={{
                placeholder: t('selectReceiver.confirm.publicKeyPlaceholder'),
                ...register('publicKey'),
              }}
              image={{
                width: '20px',
                height: '20px',
                src: images.transfer.violetAdd,
                callback: () => onAddPublicKey(),
              }}
              height="auto"
              onChange={(e) => {
                clearErrors('publicKey');
                setValue('publicKey', e.target.value);
              }}
            />
            {/* ... */}
            <Controller
              control={control}
              name="pred"
              rules={{
                required: {
                  value: true,
                  message: t('common.requiredField'),
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <BaseSelect
                  selectProps={{ onChange, onBlur, value }}
                  options={predList}
                  title={t('selectReceiver.confirm.predicateTitle')}
                  placeholder={t('selectReceiver.confirm.predicatePlaceholder')}
                  height="auto"
                />
              )}
            />
            {/* ... */}
            <DivFlex justifyContent="space-between" alignItems="center" margin="24px 0px" gap="10px">
              <Button size="full" variant="disabled" label={t('common.cancel')} onClick={() => setIsOpenConfirmModal(false)} />
              <Button size="full" variant="primary" label={t('common.continue')} form="create-account-form" />
            </DivFlex>
          </div>
        </ModalCustom>
      )}
    </>
  );
};

export default SelectReceiver;
