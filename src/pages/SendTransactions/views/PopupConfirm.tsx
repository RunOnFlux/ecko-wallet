import { useState } from 'react';
import { toast } from 'react-toastify';
import Pact from 'pact-lang-api';
import Button from 'src/components/Buttons';
import { convertRecent, getTimestamp, humanReadableNumber, shortenAddress } from 'src/utils';
import { getApiUrl, getSignatureFromHash, fetchLocal, pollRequestKey } from 'src/utils/chainweb';
import { getFloatPrecision } from 'src/utils/numbers';
import { setRecent } from 'src/stores/slices/extensions';
import { AccountType } from 'src/stores/slices/wallet';
import { CONFIG, ECKO_WALLET_SEND_TX_NONCE } from 'src/utils/config';
import { updateSendDapp } from 'src/utils/message';
import { useTranslation } from 'react-i18next';
import { addLocalActivity, addPendingCrossChainRequestKey, getLocalRecent, setLocalRecent } from 'src/utils/storage';
import AlertIconSVG from 'src/images/icon-alert.svg?react';
import { useLedgerContext } from 'src/contexts/LedgerContext';
import { useSpireKeyContext } from 'src/contexts/SpireKeyContext';
import { useGoHome } from 'src/hooks/ui';
import { CommonLabel, DivFlex, SecondaryLabel } from 'src/components';
import { LocalActivity } from 'src/components/Activities/types';
import { generateActivityWithId } from 'src/components/Activities/utils';
import SpokesLoading from 'src/components/Loading/Spokes';
import Toast from 'src/components/Toast/Toast';
import { IFungibleToken } from 'src/pages/ImportToken';
import { LoadingTitle, SpinnerWrapper } from './style';
import { TransactionInfoView } from './Transfer';
import { Warning } from '../styles';

type Props = {
  configs: any;
  onClose: any;
  aliasContact: string;
  fungibleToken: IFungibleToken;
  estimateUSDAmount?: number | null;
  kdaUSDPrice?: number;
};

const PopupConfirm = (props: Props) => {
  const { t } = useTranslation();
  const { configs, onClose, aliasContact, fungibleToken, kdaUSDPrice, estimateUSDAmount } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // const { setCrossChainRequest, getCrossChainRequestsAsync } = useContext(CrossChainContext);
  const { sendTransaction, sendCrossChainTransaction } = useLedgerContext();
  const { signTransactions, account: spireAccount, buildTransaction } = useSpireKeyContext();
  const goHome = useGoHome();
  const {
    senderName,
    senderChainId,
    senderPrivateKey,
    receiverName,
    receiverExists,
    receiverChainId,
    gasLimit,
    gasPrice,
    isCrossChain,
    senderPublicKey,
    receiverPred,
    receiverKeys,
    selectedNetwork,
    domain,
    dappAmount,
    estimateFee,
  } = configs;
  const amount = domain ? dappAmount : configs.amount;

  const validAmount = parseFloat(amount);
  const validGasPrice = parseFloat(gasPrice);
  const validGasLimit = parseFloat(gasLimit);

  const getCmd = async () => {
    const decimals = getFloatPrecision(Number.parseFloat(amount)) || 2;
    let pactCode = `(${fungibleToken.contractAddress}.transfer${receiverExists ? '' : '-create'} "${senderName}" "${receiverName}" ${
      receiverExists ? '' : '(read-keyset "ks")'
    } ${Number.parseFloat(amount).toFixed(decimals)})`;
    if (isCrossChain) {
      pactCode = `(${
        fungibleToken.contractAddress
      }.transfer-crosschain "${senderName}" "${receiverName}" (read-keyset "ks") "${receiverChainId}" ${Number.parseFloat(amount).toFixed(
        decimals,
      )})`;
    }
    const crossKeyPairs: any = {
      publicKey: senderPublicKey,
    };
    const interfaces = await fetchLocal(
      `(at 'interfaces (describe-module "${fungibleToken.contractAddress}"))`,
      selectedNetwork.url,
      selectedNetwork.networkId,
      senderChainId.toString(),
    );
    if (interfaces?.result?.data && Array.isArray(interfaces?.result?.data)) {
      if (interfaces?.result?.data?.some((moduleInterface) => moduleInterface === 'fungible-xchain-v1')) {
        crossKeyPairs.clist = [
          Pact.lang.mkCap('gas', 'pay gas', 'coin.GAS').cap,
          Pact.lang.mkCap('transfer', 'transfer coin', `${fungibleToken.contractAddress}.TRANSFER_XCHAIN`, [
            senderName,
            receiverName,
            validAmount,
            `${receiverChainId}`,
          ]).cap,
        ];
      }
    }
    const normalKeyPairs = {
      publicKey: senderPublicKey,
      clist: [
        Pact.lang.mkCap('gas', 'pay gas', 'coin.GAS').cap,
        Pact.lang.mkCap('transfer', 'transfer coin', `${fungibleToken.contractAddress}.TRANSFER`, [senderName, receiverName, validAmount]).cap,
      ],
    };
    const keyPairs: any = isCrossChain ? crossKeyPairs : normalKeyPairs;
    if (senderPrivateKey.length === 64) {
      keyPairs.secretKey = senderPrivateKey;
    }
    const cmd = {
      keyPairs,
      pactCode,
      envData: {
        ks: {
          keys: receiverKeys,
          pred: receiverPred,
        },
      },
      meta: Pact.lang.mkMeta(senderName, senderChainId.toString(), validGasPrice, validGasLimit, getTimestamp(), CONFIG.X_CHAIN_TTL),
      networkId: selectedNetwork.networkId,
    };
    return cmd;
  };

  const addRecent = (createdTime) => {
    const newRecent = {
      aliasName: aliasContact,
      createdTime,
      accountName: receiverName,
      chainId: receiverChainId,
      pred: receiverPred,
      keys: receiverKeys,
    };
    getLocalRecent(
      selectedNetwork.networkId,
      (data) => {
        const recent = data;
        recent[`${receiverChainId}`] = recent[`${receiverChainId}`] || {};
        recent[`${receiverChainId}`][`${receiverName}`] = newRecent;
        setLocalRecent(selectedNetwork.networkId, recent);
        setRecent(convertRecent(recent));
      },
      () => {
        const recent = {};
        recent[`${receiverChainId}`] = {};
        recent[`${receiverChainId}`][`${receiverName}`] = newRecent;
        setLocalRecent(selectedNetwork.networkId, recent);
        setRecent(convertRecent(recent));
      },
    );
  };

  const onListenTransaction = async (reqKey) => {
    const pollRes = await pollRequestKey(reqKey, getApiUrl(selectedNetwork.url, selectedNetwork.networkId, senderChainId));
    const status = pollRes?.result?.status || 'failure';
    if (pollRes) {
      if (status === 'success') {
        toast.success(<Toast type="success" content="Transfer Successfully" />);
      } else if (status === 'failure') {
        toast.error(<Toast type="fail" content="Transfer Fail" />);
      }
    } else {
      toast.error(<Toast type="fail" content="Transfer Fail" />);
    }
  };

  const onSend = async () => {
    if (!isSending) {
      setIsSending(true);
      const cmd = await getCmd();
      const meta = Pact.lang.mkMeta(senderName, senderChainId.toString(), validGasPrice, validGasLimit, getTimestamp(), CONFIG.X_CHAIN_TTL);
      let sendCmd: any = Pact.api.prepareExecCmd(
        cmd.keyPairs,
        `"${ECKO_WALLET_SEND_TX_NONCE}-${new Date().toISOString()}"`,
        cmd.pactCode,
        cmd.envData,
        meta,
        selectedNetwork.networkId,
      );
      const createdTime = new Date().toString();

      if (configs?.type === AccountType.LEDGER) {
        try {
          const ledgerParams = {
            recipient: receiverName,
            namespace: fungibleToken.contractAddress !== 'coin' ? fungibleToken.contractAddress?.split('.')[0] ?? undefined : undefined,
            module: fungibleToken.contractAddress !== 'coin' ? fungibleToken.contractAddress?.split('.')[1] ?? undefined : undefined,
            amount,
            chainId: Number(senderChainId),
            network: selectedNetwork.networkId,
            gasPrice: humanReadableNumber(gasPrice, 12),
            gasLimit: gasLimit.toString(),
            nonce: `${ECKO_WALLET_SEND_TX_NONCE}-${new Date().toISOString()}`,
          };
          if (isCrossChain) {
            const res = await sendCrossChainTransaction({
              ...ledgerParams,
              recipient_chainId: Number(receiverChainId),
            });
            toast.success(<Toast type="success" content={t('popupConfirm.ledgerSignSuccess')} />);
            sendCmd = res?.pact_command;
          } else {
            const res = await sendTransaction(ledgerParams);
            toast.success(<Toast type="success" content={t('popupConfirm.ledgerSignSuccess')} />);
            sendCmd = res?.pact_command;
          }
        } catch {
          toast.error(<Toast type="fail" content={t('popupConfirm.ledgerSignFailed')} />);
          return;
        }
      } else if (configs?.type === AccountType.SPIREKEY) {
        try {
          const transaction = await buildTransaction({
            senderName,
            receiverName,
            amount: Number(amount),
            chainId: senderChainId.toString(),
            networkId: selectedNetwork.networkId,
            fungibleToken: fungibleToken.contractAddress || 'coin',
            isCrossChain,
            receiverChainId: receiverChainId?.toString(),
          });

          const tokenModule = fungibleToken.contractAddress || 'coin';
          const requirements = spireAccount
            ? [
                {
                  accountName: spireAccount.accountName,
                  networkId: spireAccount.networkId,
                  chainIds: spireAccount.chainIds,
                  requestedFungibles: [
                    {
                      fungible: tokenModule,
                      amount: Number(amount) || 0,
                      ...(isCrossChain ? { target: receiverChainId } : {}),
                    },
                  ],
                },
              ]
            : [];
          const signed = await signTransactions([transaction], requirements);
          if (signed && signed.length > 0) {
            sendCmd = signed[0];
            toast.success(<Toast type="success" content={t('popupConfirm.ledgerSignSuccess')} />);
          } else {
            toast.error(<Toast type="fail" content={t('popupConfirm.ledgerSignFailed')} />);
            return;
          }
        } catch (e) {
          toast.error(<Toast type="fail" content={t('popupConfirm.ledgerSignFailed')} />);
          return;
        }
      } else if (senderPrivateKey.length > 64) {
        const signature = await getSignatureFromHash(sendCmd.hash, senderPrivateKey);
        sendCmd.sigs = [{ sig: signature }];
      }

      setIsLoading(true);
      Pact.wallet
        .sendSigned(sendCmd, getApiUrl(selectedNetwork.url, selectedNetwork.networkId, senderChainId))
        .then(async (data) => {
          const requestKey = data.requestKeys[0];
          addRecent(createdTime);
          const activity = generateActivityWithId({
            symbol: fungibleToken.symbol,
            module: fungibleToken.contractAddress,
            requestKey,
            senderChainId: senderChainId.toString(),
            receiverChainId: receiverChainId.toString(),
            receiver: receiverName,
            createdTime,
            amount,
            gasPrice,
            sender: senderName,
            domain,
            aliasName: configs?.aliasName,
            status: 'pending',
            transactionType: 'TRANSFER',
          });
          addLocalActivity(selectedNetwork.networkId, senderName, activity);
          if (senderChainId.toString() !== receiverChainId.toString()) {
            await addPendingCrossChainRequestKey({
              requestKey,
              sourceChainId: senderChainId.toString(),
              targetChainId: receiverChainId.toString(),
              networkId: selectedNetwork.networkId,
            });
          }
          if (domain) {
            updateSendDapp({
              status: 'success',
              message: t('popupConfirm.transferSuccess'),
              requestKey,
            });
            setTimeout(() => window.close(), 500);
          }
          onListenTransaction(requestKey);
          setIsLoading(false);
          toast.success(<Toast type="success" content={t('popupConfirm.transactionSent')} />);
          goHome();
        })
        .catch(() => {
          if (domain) {
            updateSendDapp({
              status: 'fail',
              message: t('popupConfirm.transferFailed'),
            });
          }
          toast.error(<Toast type="fail" content={t('popupConfirm.networkError')} />);
          setIsLoading(false);
        });
    }
  };

  const info = {
    sender: senderName,
    senderChainId,
    receiver: receiverName,
    receiverChainId,
    aliasName: configs?.aliasName,
  };

  if (isLoading) {
    return (
      <div>
        <LoadingTitle isTop>{t('popupConfirm.loadingTop')}</LoadingTitle>
        <SpinnerWrapper>
          <SpokesLoading />
        </SpinnerWrapper>
        <LoadingTitle>{t('popupConfirm.loadingBottom')}</LoadingTitle>
      </div>
    );
  }

  const isVanityAccount = !receiverName?.startsWith('k:');

  return (
    <div style={{ padding: '0 20px 20px 20px', marginTop: -15 }}>
      <TransactionInfoView info={info} containerStyle={{ borderTop: 'none', margin: '0px -20px 20px' }} />

      <div style={{ textAlign: 'center' }}>
        {configs.aliasName && (
          <DivFlex margin="10px 0 0 0" justifyContent="space-between" alignItems="center">
            <SecondaryLabel uppercase>{t('popupConfirm.labelReceiver')}</SecondaryLabel>
            <SecondaryLabel>{shortenAddress(receiverName)}</SecondaryLabel>
          </DivFlex>
        )}

        <DivFlex margin="10px 0px" justifyContent="space-between" alignItems="flex-start">
          <SecondaryLabel uppercase fontSize={16}>
            {t('popupConfirm.labelAmount')}
          </SecondaryLabel>
          <DivFlex flexDirection="column" alignItems="flex-end">
            <SecondaryLabel uppercase fontSize={16}>
              {amount} {fungibleToken.symbol}
            </SecondaryLabel>
            <CommonLabel fontSize={12} fontWeight={600} lineHeight="8px">
              {estimateUSDAmount && `${humanReadableNumber(estimateUSDAmount)} USD`}
            </CommonLabel>
          </DivFlex>
        </DivFlex>

        <DivFlex margin="10px 0 0 0" justifyContent="space-between" alignItems="center">
          <SecondaryLabel uppercase>{t('popupConfirm.labelGasLimit')}</SecondaryLabel>
          <SecondaryLabel uppercase>{gasLimit}</SecondaryLabel>
        </DivFlex>

        <DivFlex margin="1px 0px" justifyContent="space-between" alignItems="flex-start">
          <SecondaryLabel uppercase>{t('popupConfirm.labelGasPrice')}</SecondaryLabel>
          <DivFlex flexDirection="column" alignItems="flex-end">
            <SecondaryLabel uppercase>{gasPrice} KDA</SecondaryLabel>
          </DivFlex>
        </DivFlex>

        <DivFlex justifyContent="space-between" alignItems="flex-start">
          <SecondaryLabel uppercase>{t('popupConfirm.labelGasFee')}</SecondaryLabel>
          <DivFlex flexDirection="column" alignItems="flex-end">
            <SecondaryLabel uppercase>{gasPrice * gasLimit} KDA</SecondaryLabel>
            <CommonLabel fontSize={12} fontWeight={600} lineHeight="8px">
              {kdaUSDPrice ? humanReadableNumber(gasPrice * gasLimit * kdaUSDPrice) : '--'} USD
            </CommonLabel>
          </DivFlex>
        </DivFlex>

        {estimateUSDAmount && (
          <DivFlex margin="10px 0px" justifyContent="space-between" alignItems="center">
            <CommonLabel fontWeight={600} uppercase>
              {t('popupConfirm.labelTotal')}
            </CommonLabel>
            <CommonLabel fontWeight={600}>{humanReadableNumber(Number(estimateUSDAmount) + Number(estimateFee))} USD</CommonLabel>
          </DivFlex>
        )}
      </div>

      {isCrossChain && (
        <Warning margin="10px 0" style={{ justifyContent: 'center' }}>
          <AlertIconSVG />
          <div>
            <span>{t('popupConfirm.warningCrossChainLine1')}</span>
            <br />
            <span>{t('popupConfirm.warningCrossChainLine2')}</span>
          </div>
        </Warning>
      )}

      {isVanityAccount && (
        <Warning margin="10px 0" style={{ justifyContent: 'center' }}>
          <AlertIconSVG />
          <div>
            <span>{t('popupConfirm.warningNonKAccountLine1')}</span>
            <br />
            <span>{t('popupConfirm.warningNonKAccountLine2')}</span>
          </div>
        </Warning>
      )}

      <DivFlex margin={isCrossChain ? '10px 0' : '30px 0'} gap="5px">
        <Button label={t('common.cancel')} size="full" variant="secondary" onClick={() => onClose()} />
        <Button label={t('common.confirm')} size="full" onClick={onSend} disabled={isSending} />
      </DivFlex>
    </div>
  );
};

export default PopupConfirm;
