import React, { useEffect, useState } from 'react';
import { BaseTextInput } from 'src/baseComponent';
import { useAppSelector } from 'src/stores/hooks';
import { getContacts, hideLoading, showLoading } from 'src/stores/slices/extensions';
import AddIconSVG from 'src/images/add-round.svg?react';
import AlertIconSVG from 'src/images/icon-alert.svg?react';
import GearIconSVG from 'src/images/gear-icon.svg?react';
import { fetchListLocal, fetchLocal, getBalanceFromChainwebApiResponse } from 'src/utils/chainweb';
import { getLocalContacts, getExistContacts } from 'src/utils/storage';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { CommonLabel, DivBottomShadow, DivFlex, PaddedBodyStickyFooter, SecondaryLabel, StickyFooter } from 'src/components';
import { JazzAccount } from 'src/components/JazzAccount';
import PopupConfirm from 'src/pages/SendTransactions/views/PopupConfirm';
import { toast } from 'react-toastify';
import { AccountType } from 'src/stores/slices/wallet';
import Toast from 'src/components/Toast/Toast';
import { useSettingsContext } from 'src/contexts/SettingsContext';
import { useAccountBalanceContext } from 'src/contexts/AccountBalanceContext';
import { useForm } from 'react-hook-form';
import { CONFIG, GAS_CONFIGS, NUMBER_DECIMAL_AFTER_DOT } from 'src/utils/config';
import { get } from 'lodash';
import images from 'src/images';
import { BigNumberConverter, humanReadableNumber, shortenAddress } from 'src/utils';
import { IFungibleToken } from 'src/pages/ImportToken';
import Button from 'src/components/Buttons';
import CryptoAmountSelector from 'src/components/CryptoAmountSelector';
import AddContact from './AddContact';
import { Warning, Footer, Error, GasItem, ErrorWrapper } from '../styles';
import { TransferImage, AccountTransferDetail, TransferAccountSpan } from './style';
import { useTranslation } from 'react-i18next';

type Props = {
  isDappTransfer?: boolean;
  sourceChainId: any;
  destinationAccount: any;
  fungibleToken: IFungibleToken;
};

interface Wallet {
  accountName: string;
  coinBalance: number;
  tokenBalance: number;
  publicKey: string;
  chainId: string | number;
  secretKey: string;
  type?: AccountType;
}
const defaultWallet: Wallet = {
  accountName: '',
  coinBalance: 0,
  tokenBalance: 0,
  publicKey: '',
  chainId: '0',
  secretKey: '',
};

interface TransactionInfo {
  sender: string;
  senderChainId: string;
  receiver: string;
  aliasName?: string | null;
  receiverChainId: string;
}

interface TransactionInfoProps {
  info: TransactionInfo;
  containerStyle?: React.CSSProperties;
}

export const TransactionInfoView = ({ info, containerStyle }: TransactionInfoProps) => {
  const contacts = useAppSelector(getContacts);
  const renderContactOrAccount = (acc) => contacts?.find((c) => c?.accountName === acc)?.aliasName ?? shortenAddress(acc);
  return (
    <AccountTransferDetail justifyContent="space-between" alignItems="center" style={containerStyle}>
      <div>
        <JazzAccount
          account={info.sender}
          renderAccount={(acc) => (
            <DivFlex flexDirection="column">
              <TransferAccountSpan>{renderContactOrAccount(acc)}</TransferAccountSpan>
              <SecondaryLabel uppercase>chain {info.senderChainId}</SecondaryLabel>
            </DivFlex>
          )}
        />
      </div>
      <TransferImage src={images.wallet.arrowTransfer} />
      <div>
        <JazzAccount
          account={info.receiver}
          renderAccount={(acc) => (
            <DivFlex flexDirection="column">
              <TransferAccountSpan>{info.aliasName || renderContactOrAccount(acc)}</TransferAccountSpan>
              <SecondaryLabel uppercase>chain {info.receiverChainId}</SecondaryLabel>
            </DivFlex>
          )}
        />
      </div>
    </AccountTransferDetail>
  );
};

const Transfer = (props: Props) => {
  const { t } = useTranslation();
  const { destinationAccount, fungibleToken, sourceChainId, isDappTransfer } = props;
  const { data: settings } = useSettingsContext();
  const txSettings = settings?.txSettings;
  const { usdPrices } = useAccountBalanceContext();
  const [wallet, setWallet] = useState(defaultWallet);
  const [selectedGas, setSelectedGas] = useState({ ...GAS_CONFIGS.NORMAL });
  const [amount, setAmount] = useState('0.0');
  const [isNewContact, setIsNewContact] = useState(true);
  const [aliasContact, setAliasContact] = useState('');
  const [isDestinationChainTokenError, setIsDestinationChainTokenError] = useState(false);
  const [isOpenTransferModal, setIsOpenTransferModal] = useState(false);
  const [isOpenAddContactModal, setIsOpenAddContactModal] = useState(false);
  const [isOpenGasOptionsModal, setIsOpenGasOptionsModal] = useState(false);

  const onChangeAmount = (newAmount: string) => {
    setAmount(newAmount);
  };

  const checkTokenExists = async () => {
    showLoading();
    const pactCode = `(${fungibleToken.contractAddress}.details "${destinationAccount?.accountName}")`;
    const res = await fetchListLocal(
      pactCode,
      selectedNetwork.url,
      selectedNetwork.networkId,
      destinationAccount?.chainId,
      txSettings?.gasPrice,
      txSettings?.gasLimit,
    );
    if (res?.result?.error?.message?.includes('Cannot resolve') || res?.result?.error?.message?.includes('Database error')) {
      setIsDestinationChainTokenError(true);
    } else {
      setIsDestinationChainTokenError(false);
    }
  };

  useEffect(() => {
    setSelectedGas({
      ...selectedGas,
      GAS_LIMIT: txSettings?.gasLimit || CONFIG.GAS_LIMIT,
    });
  }, [txSettings]);

  useEffect(() => {
    setValue('gasLimit', selectedGas.GAS_LIMIT);
    setValue('gasPrice', selectedGas.GAS_PRICE);
  }, [selectedGas]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
    setError,
  } = useForm<any>();
  const rootStateWallet = useAppSelector((state) => state.wallet);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  useEffect(() => {
    initData();
    checkTokenExists();
    initContact();
  }, [selectedNetwork.networkId]);

  const initContact = () => {
    getLocalContacts(
      selectedNetwork.networkId,
      (data) => {
        const aliasName = getExistContacts(destinationAccount.accountName, data);
        if (aliasName && aliasName.length) {
          setIsNewContact(false);
          setAliasContact(aliasName);
        }
      },
      () => {},
    );
  };

  const initData = () => {
    const { account, publicKey, secretKey, type } = rootStateWallet;
    const pactCodeCoin = `(coin.details "${account}")`;
    const pactCodeToken = `(${fungibleToken.contractAddress}.details "${account}")`;
    showLoading();
    fetchLocal(pactCodeCoin, selectedNetwork.url, selectedNetwork.networkId, sourceChainId)
      .then((resCoin) => {
        fetchLocal(pactCodeToken, selectedNetwork.url, selectedNetwork.networkId, sourceChainId).then((resToken) => {
          hideLoading();
          const status = get(resToken, 'result.status');
          if (status === 'success') {
            const coinBalance = getBalanceFromChainwebApiResponse(resCoin);
            const tokenBalance = getBalanceFromChainwebApiResponse(resToken);
            setWallet({
              accountName: account,
              coinBalance,
              tokenBalance,
              publicKey,
              secretKey,
              type,
              chainId: sourceChainId,
            });
          }
        });
      })
      .catch(() => {
        hideLoading();
      });
  };

  const onNext = () => {
    if (destinationAccount?.accountName === rootStateWallet.account && destinationAccount?.chainId === sourceChainId) {
      toast.error(<Toast type="fail" content={t('transfer.cannotSendToYourself')} />);
    } else {
      setIsOpenTransferModal(true);
    }
  };
  const openAddContact = () => {
    setIsOpenAddContactModal(true);
  };
  const onErrors = () => {};

  const handleChangeGasPrice = (e) => {
    const { value } = e.target;
    clearErrors('gasPrice');
    let number = value
      .toString()
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*?)\..*/g, '$1');
    if (number.includes('.')) {
      const numString = number.toString().split('.');
      if (numString[1].length > NUMBER_DECIMAL_AFTER_DOT) {
        number = number.substring(0, number.length - 1);
      }
    }
    setSelectedGas({ ...selectedGas, GAS_PRICE: number });
  };
  const handleChangeGasLimit = (e) => {
    const { value } = e.target;
    clearErrors('gasLimit');
    setSelectedGas({ ...selectedGas, GAS_LIMIT: value });
  };

  const estimateFee = `${BigNumberConverter(Number(selectedGas?.GAS_LIMIT) * Number(selectedGas?.GAS_PRICE) * Number(usdPrices?.coin))}`;
  const isCrossChain = wallet?.chainId?.toString() !== destinationAccount?.chainId?.toString();
  const configs = {
    senderName: wallet?.accountName,
    senderChainId: wallet?.chainId,
    senderPublicKey: wallet?.publicKey,
    senderPrivateKey: wallet?.secretKey,
    type: wallet?.type,
    aliasName: destinationAccount?.aliasName,
    receiverName: destinationAccount?.accountName,
    receiverExists: destinationAccount?.receiverExists,
    domain: destinationAccount?.domain,
    dappAmount: destinationAccount?.dappAmount,
    receiverChainId: destinationAccount?.chainId,
    receiverPred: destinationAccount?.pred,
    receiverKeys: destinationAccount?.keys,
    gasLimit: selectedGas?.GAS_LIMIT,
    gasPrice: selectedGas?.GAS_PRICE,
    amount,
    isCrossChain,
    selectedNetwork,
    estimateFee,
  };

  const onCloseTransfer = () => {
    setIsOpenTransferModal(false);
    initData();
  };

  const onCloseAddContact = (aliasName) => {
    if (aliasName && aliasName.length) {
      setAliasContact(aliasName);
      setIsNewContact(false);
    }
    setIsOpenAddContactModal(false);
  };

  const estimateUSDAmount =
    fungibleToken.contractAddress && Object.prototype.hasOwnProperty.call(usdPrices, fungibleToken.contractAddress)
      ? (usdPrices[fungibleToken.contractAddress as any] || 0) * Number(amount)
      : null;

  const gasOptions = (
    <>
      <DivFlex justifyContent="space-evenly" margin="10px 0" gap="10px" padding="0px 24px">
        {Object.keys(GAS_CONFIGS).map((config) => {
          const gas = GAS_CONFIGS[config];
          return (
            <GasItem
              key={gas.LABEL}
              isActive={selectedGas.LABEL === gas.LABEL}
              onClick={() => {
                setSelectedGas(gas);
                clearErrors('gasLimit');
                clearErrors('gasPrice');
              }}
            >
              {gas.LABEL}
            </GasItem>
          );
        })}
      </DivFlex>
      <DivFlex gap="10px" padding="24px">
        <div style={{ flex: 1 }}>
          <BaseTextInput
            inputProps={{
              type: 'number',
              placeholder: '0',
              value: selectedGas?.GAS_LIMIT,
              ...register('gasLimit', {
                required: {
                  value: true,
                  message: t('common.requiredField'),
                },
                validate: {
                  positive: (v) => Number(v) > 0 || t('transfer.invalidGasLimit'),
                  isInteger: (v) => /^\d+$/.test(v) || t('transfer.gasLimitInteger'),
                },
              }),
            }}
            onWheel={(e) => e.currentTarget.blur()}
            title={t('transfer.form.gasLimit.title')}
            height="auto"
            onChange={handleChangeGasLimit}
          />
          {errors.gasLimit && (
            <ErrorWrapper>
              <DivFlex>
                <Error>{errors.gasLimit.message}</Error>
              </DivFlex>
            </ErrorWrapper>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <BaseTextInput
            inputProps={{
              type: 'number',
              placeholder: '0',
              value: selectedGas.GAS_PRICE,
              ...register('gasPrice', {
                required: {
                  value: true,
                  message: t('common.requiredField'),
                },
                validate: {
                  positive: (v) => Number(v) > 0 || t('transfer.invalidGasPrice'),
                },
              }),
            }}
            title={t('transfer.form.gasPrice.title')}
            height="auto"
            onChange={handleChangeGasPrice}
            onWheel={(e) => e.currentTarget.blur()}
          />
          {errors.gasPrice && (
            <ErrorWrapper>
              <DivFlex>
                <Error>{errors.gasPrice.message}</Error>
              </DivFlex>
            </ErrorWrapper>
          )}
        </div>
      </DivFlex>
    </>
  );

  const gasFee = BigNumberConverter(Number(selectedGas.GAS_PRICE) * Number(selectedGas.GAS_LIMIT));
  const canPayGas = wallet.coinBalance >= gasFee;

  useEffect(() => {
    if (!canPayGas) {
      setError('cannotPayGas', {
        message: t('transfer.insufficientFundsGas'),
      });
    } else {
      clearErrors('cannotPayGas');
    }
  }, [canPayGas]);

  return (
    <PaddedBodyStickyFooter paddingBottom={!isDappTransfer && 50}>
      <AccountTransferDetail justifyContent="space-between" alignItems="center">
        <div>
          <JazzAccount
            account={rootStateWallet.account}
            renderAccount={(acc) => (
              <DivFlex flexDirection="column">
                <TransferAccountSpan>{shortenAddress(acc)}</TransferAccountSpan>
                <SecondaryLabel uppercase>chain {sourceChainId}</SecondaryLabel>
              </DivFlex>
            )}
          />
        </div>
        <TransferImage src={images.wallet.arrowTransfer} />
        <div>
          <JazzAccount
            account={destinationAccount.accountName}
            renderAccount={(acc) => (
              <DivFlex flexDirection="column">
                <TransferAccountSpan>{shortenAddress(acc)}</TransferAccountSpan>
                <SecondaryLabel uppercase>chain {destinationAccount.chainId}</SecondaryLabel>
              </DivFlex>
            )}
          />
        </div>
      </AccountTransferDetail>
      {isNewContact && !destinationAccount.domain && (
        <Warning isContact onClick={openAddContact}>
          <AddIconSVG />
          {t('transfer.newAddressDetected')}
        </Warning>
      )}
      <form onSubmit={handleSubmit(onNext, onErrors)} id="send-transaction" noValidate>
        <CryptoAmountSelector
          fungibleToken={fungibleToken}
          showPrefilledButtons={!isDappTransfer}
          showEstimatedUSD={!isDappTransfer}
          selectedGas={selectedGas}
          tokenBalance={wallet.tokenBalance}
          readOnly={!!destinationAccount?.dappAmount}
          amount={destinationAccount?.dappAmount}
          register={register}
          setValue={setValue}
          clearErrors={clearErrors}
          errors={errors}
          onChangeAmount={onChangeAmount}
        />
        {isDestinationChainTokenError && (
          <Warning type="danger" margin="10px 0">
            <AlertIconSVG />
            <div>
              <span>
                {t('transfer.tokenNotExists', {
                  contractAddress: fungibleToken.contractAddress,
                  chainId: destinationAccount?.chainId,
                })}
              </span>
            </div>
          </Warning>
        )}
        <DivBottomShadow margin="0 -20px 20px -20px" />
        <DivFlex justifyContent="space-between">
          <SecondaryLabel fontSize={12} fontWeight={600} uppercase>
            {t('transfer.transactionParameters')}
          </SecondaryLabel>
          <GearIconSVG style={{ cursor: 'pointer' }} onClick={() => setIsOpenGasOptionsModal(true)} />
        </DivFlex>
        {errors.cannotPayGas && (
          <Warning type="danger" margin="10px 0">
            <AlertIconSVG />
            <span>{t('transfer.insufficientFundsGas')}</span>
          </Warning>
        )}
        <DivFlex justifyContent="space-between" alignItems="center" margin="20px 0">
          <SecondaryLabel fontSize={12} fontWeight={600} uppercase>
            {t('transfer.estimatedGas', { gas: configs.gasLimit * configs.gasPrice })}
            <br />
            <SecondaryLabel fontWeight={200} uppercase>
              {t('transfer.speed', { speed: selectedGas.LABEL })}
            </SecondaryLabel>
          </SecondaryLabel>
          <CommonLabel fontSize={12} fontWeight={600} uppercase>
            {t('common.usd', {
              value: humanReadableNumber(usdPrices?.coin * configs.gasLimit * configs.gasPrice),
            })}
          </CommonLabel>
        </DivFlex>
        <Footer>
          {destinationAccount.domain ? (
            <DivFlex margin="30px 0" gap="5px">
              <Button size="full" variant="disabled" label={t('common.reject')} onClick={() => window.close()} />
              <Button size="full" label={t('common.next')} form="send-transaction" />
            </DivFlex>
          ) : (
            <StickyFooter>
              <Button form="send-transaction" label={t('common.next')} size="full" style={{ width: '90%', maxWidth: 890 }} />
            </StickyFooter>
          )}
        </Footer>
      </form>
      {isOpenTransferModal && (
        <ModalCustom isOpen={isOpenTransferModal} title={t('transfer.modal.confirmTitle')} onCloseModal={onCloseTransfer} closeOnOverlayClick={false}>
          <PopupConfirm
            configs={configs}
            onClose={onCloseTransfer}
            aliasContact={aliasContact}
            fungibleToken={fungibleToken}
            estimateUSDAmount={estimateUSDAmount}
            kdaUSDPrice={usdPrices?.coin}
          />
        </ModalCustom>
      )}
      <ModalCustom
        closeOnOverlayClick
        isOpen={isOpenGasOptionsModal}
        title={t('transfer.modal.gasParametersTitle')}
        onCloseModal={() => setIsOpenGasOptionsModal(false)}
      >
        {gasOptions}
      </ModalCustom>
      {isOpenAddContactModal && (
        <ModalCustom
          isOpen
          title={t('settings.contactForm.addToAddressBook')}
          onCloseModal={() => setIsOpenAddContactModal(false)}
          closeOnOverlayClick={false}
        >
          <AddContact onClose={onCloseAddContact} contact={destinationAccount} networkId={selectedNetwork.networkId} />
        </ModalCustom>
      )}
    </PaddedBodyStickyFooter>
  );
};

export default Transfer;
