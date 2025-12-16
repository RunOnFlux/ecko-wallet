import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { DivFlex, SecondaryLabel } from 'src/components';
import SwapIcon from 'src/images/swap.svg?react';
import AlertIconSVG from 'src/images/icon-alert.svg?react';
import { Warning } from 'src/pages/SendTransactions/styles';
import { useAppSelector } from 'src/stores/hooks';
import { getSelectedNetwork } from 'src/stores/slices/extensions';
import { getWalletInfo } from 'src/stores/slices/wallet';
import { IFungibleToken } from 'src/pages/ImportToken';
import { useFungibleTokensList } from 'src/hooks/fungibleTokens';
import CryptoAmountSelector from 'src/components/CryptoAmountSelector';
import Button from 'src/components/Buttons';
import { useExecCommand, payGasCap } from 'src/hooks/pact';
import Pact from 'pact-lang-api';
import { fetchLocal, getApiUrl } from 'src/utils/chainweb';
import { useLedgerContext, bufferToHex } from 'src/contexts/LedgerContext';
import { useSpireKeyContext } from 'src/contexts/SpireKeyContext';
import { AccountType } from 'src/stores/slices/wallet';
import { useSwapContext } from 'src/contexts/SwapContext';
import { useAccountBalanceContext } from 'src/contexts/AccountBalanceContext';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { addLocalActivity } from 'src/utils/storage';
import { generateActivityWithId } from 'src/components/Activities/utils';
import { getTimestamp } from 'src/utils';
import { TokenSelector, TokenSelectionModal, SwapConfirmModal, GasSettingModal, TransactionSettingsModal } from './components';
import GasStationIcon from 'src/images/gas_station.svg?react';
import BasicSettingsIcon from 'src/images/basic-settings.svg?react';

const Body = styled.div`
  padding: 20px 20px 90px 20px;
  box-sizing: border-box;
  color: ${({ theme }) => theme.text?.primary};
`;

const SwapSection = styled.div`
  background: ${({ theme }) => theme.card?.background || theme.background};
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;

const SectionHeader = styled(DivFlex)`
  margin-bottom: 12px;
`;

const SectionTitle = styled(SecondaryLabel)`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SwapIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: -8px 0;
  position: relative;
  z-index: 1;
`;

const SwapButton = styled.button`
  background: ${({ theme }) => theme.card?.background || theme.background};
  border: 2px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: rotate(180deg);
    border-color: ${({ theme }) => theme.primary || '#ffa900'};
  }

  svg {
    width: 20px;
    height: 20px;
    path {
      fill: ${({ theme }) => theme.text?.primary};
    }
  }
`;

const PoweredBy = styled.div`
  text-align: center;
  margin-top: 16px;
  margin-bottom: 30px;
  font-size: 12px;
  color: ${({ theme }) => theme.text?.secondary};
  opacity: 0.7;
`;

const RoundedButton = styled.button<{ position: 'left' | 'right'; active?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: ${({ theme }) => theme.card?.background || theme.surface || theme.background};
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  svg {
    width: 24px;
    height: 24px;
    path {
      fill: ${({ theme, active }) => (active ? '#41cc41' : theme.text?.primary || '#787B8E')};
    }
  }
`;

type SwapDirection = 'in' | 'out';

const DEFAULT_CHAIN_ID = '2';

const SwapPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const wallet = useAppSelector(getWalletInfo);
  const fungibleTokens = useFungibleTokensList();
  const [fromTokenAddress, setFromTokenAddress] = useState<string>('coin');
  const [toTokenAddress, setToTokenAddress] = useState<string>('runonflux.flux');
  const [direction, setDirection] = useState<SwapDirection>('in');
  const [amountFrom, setAmountFrom] = useState<string>('0.0');
  const [amountTo, setAmountTo] = useState<string>('0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFromTokenModalOpen, setIsFromTokenModalOpen] = useState(false);
  const [isToTokenModalOpen, setIsToTokenModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isGasSettingModalOpen, setIsGasSettingModalOpen] = useState(false);
  const [isTransactionSettingsModalOpen, setIsTransactionSettingsModalOpen] = useState(false);

  const execCommand = useExecCommand();
  const { signHash } = useLedgerContext();
  const { signTransactions, buildTransaction, account: spireAccount } = useSpireKeyContext();
  const {
    getReserves,
    computeOut,
    computePriceImpact,
    slippage,
    gasPrice,
    gasLimit,
    setGasPrice,
    setGasLimit,
    pairReserve,
    ratio,
    enableGasStation,
  } = useSwapContext();
  const { selectedAccountBalance, usdPrices } = useAccountBalanceContext();

  const chain2Balance = selectedAccountBalance?.[2] || {};

  useEffect(() => {
    if (fromTokenAddress && toTokenAddress) {
      getReserves(fromTokenAddress, toTokenAddress);
    }
  }, [fromTokenAddress, toTokenAddress, getReserves]);

  useEffect(() => {
    if (amountFrom && Number(amountFrom) > 0 && pairReserve.token0 && pairReserve.token1) {
      const out = computeOut(amountFrom);
      if (!Number.isNaN(out) && out > 0) {
        setAmountTo(out.toFixed(12));
      }
    }
  }, [amountFrom, pairReserve, computeOut]);

  const fromToken: IFungibleToken = useMemo(() => {
    return (
      fungibleTokens.find((t) => t.contractAddress === fromTokenAddress) || {
        contractAddress: 'coin',
        symbol: 'KDA',
      }
    );
  }, [fungibleTokens, fromTokenAddress]);

  const toToken: IFungibleToken = useMemo(() => {
    return (
      fungibleTokens.find((t) => t.contractAddress === toTokenAddress) || {
        contractAddress: 'runonflux.flux',
        symbol: 'FLUX',
      }
    );
  }, [fungibleTokens, toTokenAddress]);

  const fromTokenBalance = useMemo(() => {
    return chain2Balance[fromTokenAddress] || 0;
  }, [chain2Balance, fromTokenAddress]);

  const toTokenBalance = useMemo(() => {
    return chain2Balance[toTokenAddress] || 0;
  }, [chain2Balance, toTokenAddress]);

  const handleSwapDirection = () => {
    const tempFrom = fromTokenAddress;
    const tempTo = toTokenAddress;
    setFromTokenAddress(tempTo);
    setToTokenAddress(tempFrom);
    setAmountFrom('0.0');
    setAmountTo('0.0');
  };

  const handleOpenConfirmModal = () => {
    if (!wallet.account || !wallet.publicKey) {
      toast.error(<Toast type="fail" content={t('common.error')} />);
      return;
    }
    const amountFromNum = Number(amountFrom);
    const amountToNum = Number(amountTo);
    if (!amountFromNum || amountFromNum <= 0 || !amountToNum || amountToNum <= 0) {
      toast.error(<Toast type="fail" content={t('cryptoAmountSelector.error.invalidAmount')} />);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const amountFromNum = Number(amountFrom);
      const amountToNum = Number(amountTo);

      const isSwapIn = direction === 'in';
      const token0Address = fromToken.contractAddress;
      const token1Address = toToken.contractAddress;

      const gasLimitNum = Number(gasLimit) || 10000;
      const gasPriceNum = Number(gasPrice) || 0.000001;

      const pairPactCode = `(use kaddex.exchange) (get-pair ${token0Address} ${token1Address})`;
      const pairRes = await fetchLocal(pairPactCode, selectedNetwork.url, selectedNetwork.networkId, DEFAULT_CHAIN_ID);
      const pairData = pairRes?.result?.data;
      const pairAccount = pairData?.account || (typeof pairData === 'string' ? pairData : '');

      if (!pairAccount) {
        throw new Error('Pair account not found');
      }

      const accountDetailsPactCode = `(coin.details "${wallet.account}")`;
      const accountDetailsRes = await fetchLocal(accountDetailsPactCode, selectedNetwork.url, selectedNetwork.networkId, DEFAULT_CHAIN_ID);
      const accountData = accountDetailsRes?.result?.data;
      const guard = accountData?.guard;
      const isKeysetRef = guard?.keysetref || (!guard?.keys && !guard?.pred);
      const keysetRefString = guard?.keysetref
        ? typeof guard.keysetref === 'string'
          ? guard.keysetref
          : `${guard.keysetref.ns}.${guard.keysetref.ksn}`
        : null;

      const userKsGuardCode = isKeysetRef && keysetRefString ? `(keyset-ref-guard "${keysetRefString}")` : `(read-keyset "user-ks")`;

      const pactCode = isSwapIn
        ? `(kaddex.exchange.swap-exact-in (read-decimal "token0Amount") (read-decimal "token1AmountWithSlippage") [${token0Address} ${token1Address}] "${wallet.account}" "${wallet.account}" ${userKsGuardCode})`
        : `(kaddex.exchange.swap-exact-out (read-decimal "token1Amount") (read-decimal "token0AmountWithSlippage") [${token0Address} ${token1Address}] "${wallet.account}" "${wallet.account}" ${userKsGuardCode})`;

      const transferCap = Pact.lang.mkCap('transfer capability', 'transfer token in', `${token0Address}.TRANSFER`, [
        wallet.account,
        pairAccount,
        amountFromNum,
      ]);

      const token0AmountWithSlippage = amountFromNum * (1 + slippage);
      const token1AmountWithSlippage = amountToNum * (1 - slippage);

      let envData: any = {
        token0Amount: amountFromNum,
        token1Amount: amountToNum,
        token0AmountWithSlippage,
        token1AmountWithSlippage,
      };

      if (!isKeysetRef || !keysetRefString) {
        let userKsGuard: any;
        if (wallet.type === AccountType.SPIREKEY && (!guard?.keys || !guard?.pred)) {
          const signingPubKey = wallet.publicKey;
          userKsGuard = {
            pred: 'keys-any',
            keys: [signingPubKey],
          };
        } else {
          userKsGuard = guard || {
            keys: [wallet.publicKey],
            pred: 'keys-all',
          };
        }
        envData['user-ks'] = userKsGuard;
      }

      let response: any;

      if (wallet.type === AccountType.SPIREKEY) {
        const meta = Pact.lang.mkMeta(wallet.account, DEFAULT_CHAIN_ID, gasPriceNum, gasLimitNum, getTimestamp(), 600);
        const caps = [payGasCap.cap, transferCap.cap];
        const keyPairs: any = {
          publicKey: wallet.publicKey,
          clist: caps,
        };

        const cmd = Pact.api.prepareExecCmd(keyPairs, `"${new Date().toISOString()}"`, pactCode, envData, meta, selectedNetwork.networkId);

        const requirements = spireAccount
          ? [
              {
                accountName: spireAccount.accountName,
                networkId: spireAccount.networkId,
                chainIds: spireAccount.chainIds,
                requestedFungibles: [
                  {
                    fungible: token0Address,
                    amount: amountFromNum,
                  },
                ],
              },
            ]
          : [];

        const signed = await signTransactions([cmd], requirements);
        if (!signed || !signed.length) {
          throw new Error('SpireKey signing failed');
        }

        const sendCmd = signed[0];
        const url = getApiUrl(selectedNetwork.url, selectedNetwork.networkId, DEFAULT_CHAIN_ID);
        response = await Pact.wallet.sendSigned(sendCmd, url);
      } else if (wallet.type === AccountType.LEDGER) {
        const meta = Pact.lang.mkMeta(wallet.account, DEFAULT_CHAIN_ID, gasPriceNum, gasLimitNum, getTimestamp(), 600);
        const caps = [payGasCap.cap, transferCap.cap];
        const keyPairs: any = {
          publicKey: wallet.publicKey,
          clist: caps,
        };

        const cmd = Pact.api.prepareExecCmd(keyPairs, `"${new Date().toISOString()}"`, pactCode, envData, meta, selectedNetwork.networkId);

        const signHashResult = await signHash(cmd.hash);
        if (!signHashResult?.signature) {
          throw new Error('Ledger signing failed');
        }

        cmd.sigs = [{ sig: bufferToHex(signHashResult.signature) }];
        const url = getApiUrl(selectedNetwork.url, selectedNetwork.networkId, DEFAULT_CHAIN_ID);
        response = await Pact.wallet.sendSigned(cmd, url);
      } else {
        const capabilities = [payGasCap, transferCap];
        const result = await execCommand(pactCode, DEFAULT_CHAIN_ID, capabilities, envData);
        response = result.response;
      }

      const requestKey = response?.requestKeys?.[0];
      if (requestKey) {
        const createdTime = getTimestamp();

        const activity = generateActivityWithId({
          amount: amountFromNum.toString(),
          createdTime: new Date(createdTime).toString(),
          direction: 'OUT',
          gas: gasLimitNum * gasPriceNum,
          gasPrice: gasPriceNum,
          module: 'kaddex.exchange',
          receiver: 'Swap',
          receiverChainId: DEFAULT_CHAIN_ID.toString(),
          requestKey,
          sender: wallet.account,
          senderChainId: DEFAULT_CHAIN_ID.toString(),
          status: 'pending',
          symbol: fromToken.symbol,
          transactionType: 'SWAP',
          ticker: fromToken.symbol,
        });

        await addLocalActivity(selectedNetwork.networkId, wallet.account, activity);

        setIsConfirmModalOpen(false);
        toast.success(<Toast type="success" content={t('swap.swapBlock.submittedMessage')} />);
        history.push('/history');
      } else {
        toast.error(<Toast type="fail" content={t('common.error')} />);
        setIsSubmitting(false);
      }
    } catch (e: any) {
      toast.error(<Toast type="fail" content={e?.message || t('common.error')} />);
      setIsSubmitting(false);
    }
  };

  const handleChangeAmountFrom = (value: string) => {
    setAmountFrom(value);
    if (value && Number(value) > 0 && pairReserve.token0 && pairReserve.token1) {
      const out = computeOut(value);
      if (!Number.isNaN(out) && out > 0) {
        setAmountTo(out.toFixed(12));
      } else {
        setAmountTo('0.0');
      }
    } else {
      setAmountTo('0.0');
    }
  };

  const handleChangeAmountTo = (value: string) => {
    setAmountTo(value);
  };

  const estimateFromUSD = useMemo(() => {
    if (usdPrices[fromTokenAddress]) {
      return Number(amountFrom) * usdPrices[fromTokenAddress];
    }
    return null;
  }, [amountFrom, fromTokenAddress, usdPrices]);

  const estimateToUSD = useMemo(() => {
    if (usdPrices[toTokenAddress]) {
      return Number(amountTo) * usdPrices[toTokenAddress];
    }
    return null;
  }, [amountTo, toTokenAddress, usdPrices]);

  const kdaUSDPrice = usdPrices['coin'] || 0;
  const gasFee = Number(gasPrice) * Number(gasLimit);
  const gasFeeUSD = gasFee * kdaUSDPrice;

  const priceImpact = useMemo(() => {
    if (amountFrom && amountTo && Number(amountFrom) > 0 && Number(amountTo) > 0) {
      return computePriceImpact(amountFrom, amountTo);
    }
    return 0;
  }, [amountFrom, amountTo, computePriceImpact]);

  const priceInfo = useMemo(() => {
    if (pairReserve.token0 && pairReserve.token1 && !Number.isNaN(ratio)) {
      return `1 ${fromToken.symbol.toUpperCase()} ≈ ${(1 / ratio).toFixed(6)} ${toToken.symbol.toUpperCase()}`;
    }
    return null;
  }, [pairReserve, ratio, fromToken, toToken]);

  const registerStub: any = () => ({
    onChange: async () => {},
    onBlur: async () => {},
    ref: () => {},
    name: 'amount',
  });

  const setValueStub: any = () => {};

  const clearErrorsStub: any = () => {};

  return (
    <>
      <Body>
        <Warning>
          <AlertIconSVG />
          <div>{t('swap.chain2Warning.message', 'Swap functionality is only available on Chain 2. Make sure you have funds on Chain 2.')}</div>
        </Warning>

        <SwapSection>
          <SectionHeader justifyContent="space-between" alignItems="center">
            <SectionTitle>{t('swap.give', 'GIVE')}</SectionTitle>
            <TokenSelector tokenAddress={fromTokenAddress} tokenSymbol={fromToken.symbol} onClick={() => setIsFromTokenModalOpen(true)} />
          </SectionHeader>
          <CryptoAmountSelector
            fungibleToken={fromToken}
            tokenBalance={fromTokenBalance}
            register={registerStub}
            setValue={setValueStub}
            clearErrors={clearErrorsStub}
            errors={{}}
            readOnly={false}
            amount={amountFrom}
            onChangeAmount={handleChangeAmountFrom}
            showPrefilledButtons={false}
            hideLabel={true}
          />
        </SwapSection>

        <SwapIconWrapper>
          <SwapButton onClick={handleSwapDirection} type="button">
            <SwapIcon />
          </SwapButton>
        </SwapIconWrapper>

        <SwapSection>
          <SectionHeader justifyContent="space-between" alignItems="center">
            <SectionTitle>{t('swap.receive', 'RECEIVE')}</SectionTitle>
            <TokenSelector tokenAddress={toTokenAddress} tokenSymbol={toToken.symbol} onClick={() => setIsToTokenModalOpen(true)} />
          </SectionHeader>
          <CryptoAmountSelector
            fungibleToken={toToken}
            tokenBalance={toTokenBalance}
            register={registerStub}
            setValue={setValueStub}
            clearErrors={clearErrorsStub}
            errors={{}}
            readOnly={true}
            amount={amountTo}
            onChangeAmount={handleChangeAmountTo}
            showPrefilledButtons={false}
            hideLabel={true}
          />
        </SwapSection>

        {priceInfo && (
          <DivFlex justifyContent="space-between" margin="16px 0">
            <SecondaryLabel fontSize={12}>{priceInfo}</SecondaryLabel>
          </DivFlex>
        )}

        <DivFlex justifyContent="space-between" margin="15px 0 20px 0">
          <RoundedButton position="left" onClick={() => setIsTransactionSettingsModalOpen(true)} type="button">
            <BasicSettingsIcon />
          </RoundedButton>
          <PoweredBy>Powered by eckoDEX</PoweredBy>
          <RoundedButton position="right" onClick={() => setIsGasSettingModalOpen(true)} type="button" active={enableGasStation}>
            <GasStationIcon />
          </RoundedButton>
        </DivFlex>
        <DivFlex margin="0px 0px 20px 0px" justifyContent="center">
          <Button
            size="full"
            variant={isSubmitting || !amountFrom || Number(amountFrom) <= 0 ? 'disabled' : 'primary'}
            label={isSubmitting ? t('swap.swapping', 'Swapping...') : t('swap.swapBlock.confirm', 'Swap')}
            onClick={handleOpenConfirmModal}
            style={{ width: '90%', maxWidth: 890, cursor: 'pointer' }}
            disabled={isSubmitting || !amountFrom || Number(amountFrom) <= 0}
          />
        </DivFlex>
      </Body>

      <TokenSelectionModal
        isOpen={isFromTokenModalOpen}
        onClose={() => setIsFromTokenModalOpen(false)}
        tokens={fungibleTokens}
        selectedAddress={fromTokenAddress}
        onSelectToken={(address) => {
          setFromTokenAddress(address);
          getReserves(address, toTokenAddress);
        }}
      />

      <TokenSelectionModal
        isOpen={isToTokenModalOpen}
        onClose={() => setIsToTokenModalOpen(false)}
        tokens={fungibleTokens}
        selectedAddress={toTokenAddress}
        onSelectToken={(address) => {
          setToTokenAddress(address);
          getReserves(fromTokenAddress, address);
        }}
      />

      <SwapConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleSubmit}
        isSubmitting={isSubmitting}
        fromToken={fromToken}
        toToken={toToken}
        amountFrom={amountFrom}
        amountTo={amountTo}
        estimateFromUSD={estimateFromUSD}
        estimateToUSD={estimateToUSD}
        slippage={slippage}
        priceImpact={priceImpact}
        gasPrice={gasPrice}
        gasLimit={gasLimit}
        gasFee={gasFee}
        gasFeeUSD={gasFeeUSD}
      />

      <GasSettingModal isOpen={isGasSettingModalOpen} onClose={() => setIsGasSettingModalOpen(false)} />

      <TransactionSettingsModal isOpen={isTransactionSettingsModalOpen} onClose={() => setIsTransactionSettingsModalOpen(false)} />
    </>
  );
};

export default SwapPage;
