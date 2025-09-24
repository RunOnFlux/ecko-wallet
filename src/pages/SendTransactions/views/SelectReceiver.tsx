import { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { hideLoading, showLoading } from 'src/stores/slices/extensions';
import { extractDecimal, fetchListLocal, fetchAccountDetails } from 'src/utils/chainweb';
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
import { NON_TRANSFERABLE_TOKENS, getTokenImageUrl } from 'src/utils/constant';
import { SelectionOption } from 'src/components/RadioSelection';
import useLocalStorage from 'src/hooks/useLocalStorage';
import { IFungibleTokensByNetwork, LOCAL_DEFAULT_FUNGIBLE_TOKENS, LOCAL_KEY_FUNGIBLE_TOKENS } from 'src/pages/ImportToken';
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
import { createWarningModal } from 'src/utils/modalHelpers';
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
  const [localFungibleTokens] = useLocalStorage<IFungibleTokensByNetwork>(LOCAL_KEY_FUNGIBLE_TOKENS, LOCAL_DEFAULT_FUNGIBLE_TOKENS);
  const networkId = selectedNetwork?.networkId;
  const tokenOptions: SelectionOption[] = useMemo(() => {
    const userTokens = ((localFungibleTokens && localFungibleTokens[networkId]) || []) as any[];
    const defaultTokens = (LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId] || []).map((t) => t.contractAddress);
    const filtered = userTokens.filter((ft) => !defaultTokens.includes(ft.contractAddress));
    const mapped = filtered
      .map((ft) => ({
        label: (ft.symbol as string)?.toUpperCase?.() || (ft.symbol as string),
        value: ft.contractAddress as string,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ label: 'KDA', value: 'coin' }, { label: 'FLUX', value: 'runonflux.flux' }, ...mapped];
  }, [localFungibleTokens, networkId]);
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
      token: {
        value: fungibleToken?.contractAddress,
        label: (fungibleToken?.symbol as string)?.toUpperCase?.() || (fungibleToken?.symbol as string),
      },
    },
  });

  const destinationAccountInputRef = useRef<HTMLInputElement>(null);
  const rect = destinationAccountInputRef?.current?.getBoundingClientRect();

  const accountName = getValues('accountName');

  const debouncedAccountName = useDebounce(accountName, 500);
  useEffect(() => {
    setValue('token', {
      value: fungibleToken?.contractAddress,
      label: (fungibleToken?.symbol as string)?.toUpperCase?.() || (fungibleToken?.symbol as string),
    } as any);
  }, [fungibleToken?.contractAddress, fungibleToken?.symbol]);

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

  const openSendAlertModal = () => {
    openModal({
      title: t('selectReceiver.confirm.warningTitle'),
      content: <div>{t('selectReceiver.alerts.genericProceed')}</div>,
    });
  };

  const onNext = async () => {
    const receiver: string = convertedAccountName || getValues('accountName');
    const aliasName = receiver !== getValues('accountName') ? getValues('accountName') : null;
    const chainId: any = getValues('chainId')?.value;
    const sourceChainIdValue: any = getValues('sourceChainId')?.value;
    if (chainId === null) {
      setError('chainId', { type: 'required', message: t('common.requiredField') });
      return;
    }
    const isDuplicated = receiver === rootStateWallet?.account && chainId.toString() === sourceChainIdValue.toString();
    if (isDuplicated) {
      toast.error(<Toast type="fail" content={t('transfer.cannotSendToYourself')} />);
    } else {
      showLoading();
      const isRAccount = receiver.startsWith('r:');
      const prefix = fungibleToken?.contractAddress || 'coin';
      const code = `(${prefix}.details "${receiver}")`;
      fetchListLocal(code, selectedNetwork.url, selectedNetwork.networkId, chainId, txSettings?.gasPrice, txSettings?.gasLimit)
        .then(async (res) => {
          hideLoading();
          setIsSearching(false);
          const status = get(res, 'result.status');
          const exist = status === 'success';
          const pred = get(res, 'result.data.guard.pred');
          const keys = get(res, 'result.data.guard.keys');

          if (exist) {
            // account exists for this token
            const destinationAccount = {
              accountName: receiver,
              aliasName,
              chainId,
              pred,
              keys,
              receiverExists: true,
              isRAccount,
              keysetRefGuard: isRAccount ? get(res, 'result.data.guard') : undefined,
            };
            goToTransferAccount(destinationAccount, sourceChainIdValue);
          } else if (receiver.startsWith('k:')) {
            // fallback k: create
            const destinationAccount = {
              accountName: receiver,
              aliasName,
              chainId,
              pred: predList[0].value,
              keys: [receiver.substring(2)],
            };
            goToTransferAccount(destinationAccount, sourceChainIdValue);
          } else if (isRAccount) {
            // r: account
            if (prefix === 'coin') {
              // r: on coin does not exist yet
              openModal(
                createWarningModal({
                  message: t('selectReceiver.alerts.rAccountNotActive'),
                  onCancel: () => {
                    setValue('accountName', '');
                    closeModal();
                  },
                }),
              );
            } else {
              // Token ≠ coin: try to read the guard from coin.details to use transfer-create with keyset-ref-guard
              try {
                const accountDetails = await fetchAccountDetails(
                  receiver,
                  'coin',
                  selectedNetwork.url,
                  selectedNetwork.networkId,
                  chainId,
                  txSettings?.gasPrice,
                  txSettings?.gasLimit,
                );

                if (accountDetails?.result?.status === 'success') {
                  // exists on coin but not on token -> we will use transfer-create on token with keyset-ref-guard
                  const destinationAccount = {
                    accountName: receiver,
                    aliasName,
                    chainId,
                    // no pred/keys for r:
                    isRAccount: true,
                    receiverExists: false,
                    keysetRefGuard: get(accountDetails, 'result.data.guard'),
                  };
                  goToTransferAccount(destinationAccount, sourceChainIdValue);
                } else {
                  // does not exist on coin
                  openModal(
                    createWarningModal({
                      message: t('selectReceiver.alerts.rAccountNotExistForToken', { token: prefix }),
                      onCancel: () => {
                        setValue('accountName', '');
                        closeModal();
                      },
                      onContinue: () => {
                        closeModal();
                      },
                    }),
                  );
                }
              } catch (error) {
                console.error('Error checking account details:', error);
                toast.error(<Toast type="fail" content={t('selectReceiver.error.checkingAccountDetails')} />);
              }
            }
          } else {
            // Vanity / other
            setAccount({
              accountName: receiver,
              chainId,
            });
            openModal(
              createWarningModal({
                message: t('selectReceiver.alerts.nonKRWarning'),
                onCancel: () => {
                  setValue('accountName', '');
                  closeModal();
                },
                onContinue: () => {
                  closeModal();
                  setIsOpenConfirmModal(true);
                },
              }),
            );
          }
        })
        .catch(() => {
          toast.error(<Toast type="fail" content={t('popupConfirm.networkError')} />);
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
                name="token"
                render={({ field: { onChange, value } }) => {
                  const selected = (value?.value as string) || (fungibleToken?.contractAddress as string);
                  const iconUrl = getTokenImageUrl(selected || 'coin');
                  return (
                    <BaseModalSelect
                      value={value}
                      onChange={(opt) => {
                        onChange(opt);
                        const params = new URLSearchParams(history.location.search);
                        if (opt?.value) {
                          params.set('coin', opt.value as string);
                        } else {
                          params.delete('coin');
                        }
                        history.replace({ search: params.toString() });
                      }}
                      options={tokenOptions}
                      title={t('selectReceiver.form.tokenTitle') || 'Token'}
                      displayValue={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            crossOrigin="anonymous"
                            src={iconUrl}
                            alt="token"
                            style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                          />
                          <span>
                            {(value?.label as string) || (fungibleToken?.symbol as string)?.toUpperCase?.() || (fungibleToken?.symbol as string)}
                          </span>
                        </div>
                      }
                    />
                  );
                }}
              />
            </InputWrapper>

            <InputWrapper>
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
          isOpen={isOpenConfirmModal}
          title={t('selectReceiver.confirm.warningTitle')}
          onCloseModal={() => setIsOpenConfirmModal(false)}
          closeOnOverlayClick={false}
        >
          <div style={{ padding: '0 24px' }}>
            <DivFlex justifyContent="center">
              <JazzAccount
                diameter={50}
                account={account.accountName}
                renderAccount={
                  account.accountName &&
                  ((acc) => (
                    <DivFlex flexDirection="column">
                      <CommonLabel color={theme.footer?.primary} fontWeight={700} fontSize={14}>
                        {acc}
                      </CommonLabel>
                      <SecondaryLabel fontWeight={500}>{t('selectReceiver.chainLabel', { chainId: account.chainId })}</SecondaryLabel>
                    </DivFlex>
                  ))
                }
              />
            </DivFlex>

            <DivFlex justifyContent="center" marginTop="20px" style={{ textAlign: 'center' }}>
              <CommonLabel fontWeight={600} fontSize={14}>
                {t('selectReceiver.confirm.notExistLine1')} <br />
                {t('selectReceiver.confirm.notExistLine2')}
              </CommonLabel>
            </DivFlex>
            <form onSubmit={handleSubmit(onCreateAccount)} id="create-account-form">
              <InputWrapper>
                <BaseTextInput
                  inputProps={{
                    placeholder: t('selectReceiver.confirm.publicKeyPlaceholder', { defaultValue: 'Input public key' }),
                    ...register('publicKey', {
                      required: false,
                    }),
                  }}
                  image={{
                    width: '20px',
                    height: '20px',
                    src: images.transfer.violetAdd,
                    callback: () => onAddPublicKey(),
                  }}
                  title={t('selectReceiver.confirm.publicKeyTitle')}
                  height="auto"
                  onChange={(e) => {
                    clearErrors('publicKey');
                    setValue('publicKey', e.target.value);
                  }}
                />
                {errors.publicKey && <InputError>{errors.publicKey.message}</InputError>}
              </InputWrapper>
              {pKeys.length > 0 && renderKeys()}
              <InputWrapper>
                <Controller
                  control={control}
                  name="pred"
                  rules={{
                    required: {
                      value: true,
                      message: 'This field is required.',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <BaseSelect
                      selectProps={{
                        onChange,
                        onBlur,
                        value,
                      }}
                      options={predList}
                      title={t('selectReceiver.confirm.predicateTitle')}
                      height="auto"
                      placeholder={t('selectReceiver.confirm.predicatePlaceholder')}
                    />
                  )}
                />
                {errors.pred && !getValues('pred') && <InputError>{errors.pred}</InputError>}
              </InputWrapper>
            </form>
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
