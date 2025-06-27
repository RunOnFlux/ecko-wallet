/* eslint-disable react/jsx-curly-newline */
import { useHistory } from 'react-router-dom';
import images from 'src/images';
import RefreshIconSVG from 'src/images/refresh.svg?react';
import SearchIconSVG from 'src/images/search.svg?react';
import AddIconSVG from 'src/images/add-round.svg?react';
import styled from 'styled-components';
import AlertIconSVG from 'src/images/icon-alert.svg?react';
import CircledButton from 'src/components/Buttons/CircledButton';
import Spinner from 'src/components/Spinner';
import { Header } from 'src/components/Header';
import { toast } from 'react-toastify';
import { NON_TRANSFERABLE_TOKENS } from 'src/utils/constant';
import Toast from 'src/components/Toast/Toast';
import { DivBottomShadow, DivFlex, PrimaryLabel, SecondaryLabel } from 'src/components';
import { ConfirmModal } from 'src/components/ConfirmModal';
import { IconButton } from 'src/components/IconButton';
import { ActionList } from 'src/components/ActionList';
import { roundNumber, BigNumberConverter, humanReadableNumber } from 'src/utils';
import { MAINNET_NETWORK_ID, extractDecimal } from 'src/utils/chainweb';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import useLocalStorage from 'src/hooks/useLocalStorage';
import { useModalContext } from 'src/contexts/ModalContext';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { useAccountBalanceContext } from 'src/contexts/AccountBalanceContext';
import NotificationManager from 'src/components/NotificationManager';
import ReceiveModal from './views/ReceiveModal';
import { IFungibleTokensByNetwork, LOCAL_DEFAULT_FUNGIBLE_TOKENS, LOCAL_KEY_FUNGIBLE_TOKENS } from '../ImportToken';
import { TokenElement } from './components/TokenElement';
import { TokenChainBalance } from './components/TokenChainBalance';
import { AssetsList } from './components/AssetsList';
import { Warning } from '../SendTransactions/styles';
import { useAppSelector } from 'src/stores/hooks';
import TokenDetector from './components/TokenDetector';
import { useTranslation } from 'react-i18next';

export interface IFungibleTokenBalance {
  contractAddress: string;
  symbol: string;
  chainBalance: number;
  allChainBalance: number;
}

interface ChainDistribution {
  chainId: number;
  balance: number;
}

export const DivAsset = styled.div`
  padding: 20px;
  margin-bottom: 60px;
`;
export const DivAssetList = styled.div`
  .token-element {
    border-top: 1px solid ${({ theme }) => theme?.border};
  }
  .token-element:first-child {
    border-top: none;
  }
`;

const Wallet = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { openModal, closeModal } = useModalContext();
  const { isLoadingBalances, selectedAccountBalance, allAccountsBalance, allAccountsBalanceUsd } = useAccountBalanceContext();
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const networkId = selectedNetwork?.networkId;
  const [fungibleTokens, setFungibleTokens] = useLocalStorage<IFungibleTokensByNetwork>(LOCAL_KEY_FUNGIBLE_TOKENS, LOCAL_DEFAULT_FUNGIBLE_TOKENS);
  const fungibleTokensByNetwork = (fungibleTokens && fungibleTokens[networkId]) || [];

  const stateWallet = useCurrentWallet();

  const getTokenTotalBalance = (contractAddress: string, account: string): number => {
    const accountChainBalance = allAccountsBalance && allAccountsBalance[account];
    return accountChainBalance?.reduce((prev, curr) => prev + ((curr && extractDecimal(curr[contractAddress])) || 0), 0) || 0;
  };

  const getTokenUsdBalance = (tokenSymbol, chainId?: number): number => {
    const account = stateWallet?.account;
    let sum = 0;
    if (allAccountsBalanceUsd && allAccountsBalanceUsd[account]) {
      if (typeof chainId === 'number') {
        sum = allAccountsBalanceUsd[account][chainId]?.[tokenSymbol] ?? 0;
      } else {
        sum = allAccountsBalanceUsd[account].reduce((prev, curr) => prev + (curr[tokenSymbol] ?? 0), 0);
      }
    }
    return BigNumberConverter(sum);
  };

  const getAccountBalance = (account: string) => {
    let sum = 0;
    if (allAccountsBalanceUsd && allAccountsBalanceUsd[account]) {
      sum = allAccountsBalanceUsd[account].reduce((prev, curr) => prev + Object.values(curr).reduce((p, c) => p + c, 0), 0);
    }
    return sum;
  };

  const getTokenChainDistribution = (contractAddress: string): ChainDistribution[] =>
    selectedAccountBalance?.map((b: any, i) => ({ chainId: i, balance: (b && extractDecimal(b[contractAddress])) || 0 })) ?? [];

  const getAllChainUsdBalance = () => {
    let totalUSDBalance = 0;
    if (allAccountsBalanceUsd && Object.values(allAccountsBalanceUsd).length) {
      totalUSDBalance = Object.values(allAccountsBalanceUsd)
        .flat()
        .reduce(
          // Iterate over all accounts
          (sum, value) =>
            // Iterate over all tokens
            sum + Object.values(value).reduce((p, c) => p + c, 0),
          0,
        );
    }
    return totalUSDBalance;
  };

  const handleRemoveToken = (contractAddress) => {
    const newFungibleTokens = fungibleTokensByNetwork?.filter((ft) => ft.contractAddress !== contractAddress) ?? [];
    setFungibleTokens({ ...fungibleTokens, [networkId]: newFungibleTokens });
    toast.success(<Toast type="success" content={t('wallet.tokenRemoved')} />);
    closeModal();
  };

  const handleBuy = () => {
    history.push('/buy');
  };

  const renderChainDistribution = (symbol: string, contractAddress: string) => {
    const isNonTransferable = NON_TRANSFERABLE_TOKENS.some((nonTransf) => nonTransf === contractAddress);
    const hasBalance = getTokenChainDistribution(contractAddress).filter((cD) => cD.balance > 0)?.length > 0;
    return (
      <div style={{ padding: 20 }}>
        {isNonTransferable && (
          <Warning justifyContent="center" type="danger" margin="-20px 0px 10px 0px">
            <AlertIconSVG />
            <div>
              <span>{t('wallet.notTransferable', { contractAddress })}</span>
            </div>
          </Warning>
        )}
        {getTokenChainDistribution(contractAddress)
          .filter((cD) => cD.balance > 0)
          .map((cD) => (
            <TokenChainBalance
              key={cD.chainId}
              name={symbol}
              isNonTransferable={isNonTransferable}
              contractAddress={contractAddress}
              chainId={cD.chainId}
              balance={cD.balance}
              usdBalance={getTokenUsdBalance(contractAddress, cD.chainId)}
            />
          ))}
        {!hasBalance && symbol?.toLowerCase() === 'kda' && <Warning justifyContent="center">{t('wallet.accountDoesNotExist')}</Warning>}
        {!hasBalance && symbol?.toLowerCase() !== 'kda' && (
          <Warning justifyContent="center">{t('wallet.balanceZero', { symbol: symbol?.toUpperCase() })}</Warning>
        )}
        {['coin', 'runonflux.flux'].every((add) => add !== contractAddress) && (
          <ActionList
            actions={[
              {
                src: images.settings.iconTrash,
                label: t('wallet.removeToken'),
                onClick: () =>
                  openModal({
                    title: t('wallet.removeTokenTitle', { symbol: symbol.toUpperCase() }),
                    content: (
                      <ConfirmModal
                        text={t('wallet.confirmRemoveToken', { symbol: symbol.toUpperCase() })}
                        onClose={closeModal}
                        onConfirm={() => handleRemoveToken(contractAddress)}
                      />
                    ),
                  }),
              },
              {
                src: images.settings.iconEdit,
                label: t('wallet.editToken'),
                onClick: () => {
                  closeModal();
                  history.push(`/import-token?coin=${contractAddress}`);
                },
              },
            ]}
          />
        )}
      </div>
    );
  };

  const handleHistory = () => {
    history.push('/history');
  };

  const { theme } = useAppThemeContext();

  return (
    <div>
      <Header />
      <DivFlex justifyContent="space-between" padding="15px 20px">
        <SecondaryLabel>{t('wallet.netWorth')}</SecondaryLabel>
        <SecondaryLabel color={theme.text?.primary}>
          {isLoadingBalances ? (
            <Spinner size={10} color={theme.text?.primary} weight={2} />
          ) : (
            `$ ${humanReadableNumber(getAllChainUsdBalance().toFixed(2), 2)}`
          )}
        </SecondaryLabel>
      </DivFlex>
      <DivBottomShadow justifyContent="center" flexDirection="column" alignItems="center" padding="20px">
        <SecondaryLabel>{t('wallet.accountBalance')}</SecondaryLabel>
        <PrimaryLabel>$ {humanReadableNumber(getAccountBalance(stateWallet?.account).toFixed(2), 2)}</PrimaryLabel>
        <DivFlex justifyContent="space-around" style={{ width: '100%', marginTop: 30 }}>
          <CircledButton
            onClick={() => history.push('/transfer?coin=kda&chainId=0')}
            label={t('wallet.send')}
            iconUrl={images.wallet.arrowSend}
            variant="primary"
          />
          <CircledButton
            onClick={() => openModal({ title: t('wallet.receiveTokens'), content: <ReceiveModal /> })}
            label={t('wallet.receive')}
            iconUrl={images.wallet.arrowReceive}
            variant="secondary"
          />
          <CircledButton onClick={handleBuy} label={t('wallet.buy')} iconUrl={images.wallet.iconBuy} variant="brand" />
          <CircledButton onClick={handleHistory} label={t('wallet.history')} iconUrl={images.iconHistory} variant="empty" />
        </DivFlex>
      </DivBottomShadow>
      <DivAsset>
        <DivFlex justifyContent="space-between">
          <SecondaryLabel style={{ paddingTop: 10 }}>{t('wallet.assets')}</SecondaryLabel>
          <DivFlex>
            {selectedNetwork.networkId === MAINNET_NETWORK_ID && (
              <>
                <IconButton
                  onClick={() =>
                    openModal({
                      title: t('wallet.detectedTokens'),
                      content: (
                        <TokenDetector
                          onTokenSelect={(t) => {
                            closeModal();
                            history.push(`/import-token?suggest=${t.contract}`);
                          }}
                        />
                      ),
                    })
                  }
                  svgComponent={<RefreshIconSVG style={{ marginTop: -2 }} />}
                />
                <IconButton onClick={() => openModal({ title: t('wallet.tokenList'), content: <AssetsList /> })} svgComponent={<SearchIconSVG />} />
              </>
            )}
            <IconButton onClick={() => history.push('/import-token')} svgComponent={<AddIconSVG />} style={{ marginLeft: 5 }} />
          </DivFlex>
        </DivFlex>
        <DivAssetList>
          <TokenElement
            isLoadingBalances={isLoadingBalances}
            balance={getTokenTotalBalance('coin', stateWallet?.account)}
            name="KDA"
            usdBalance={roundNumber(getTokenUsdBalance('coin'), 2)}
            contractAddress={'coin'}
            onClick={() =>
              selectedAccountBalance &&
              openModal({
                title: t('wallet.kdaChainDistribution'),
                content: renderChainDistribution('kda', 'coin'),
              })
            }
          />
          {LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId] &&
            LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId].map((token) => (
              <TokenElement
                key={token.contractAddress}
                isLoadingBalances={isLoadingBalances}
                balance={getTokenTotalBalance(token.contractAddress, stateWallet?.account)}
                name={token.symbol?.toLocaleUpperCase()}
                usdBalance={roundNumber(getTokenUsdBalance(token.contractAddress), 2)}
                contractAddress={token.contractAddress}
                onClick={() =>
                  selectedAccountBalance &&
                  openModal({
                    title: `${token.symbol.toLocaleUpperCase()} ${t('wallet.chainDistribution')}`,
                    content: renderChainDistribution(token.symbol, token.contractAddress),
                  })
                }
              />
            ))}
          {fungibleTokensByNetwork
            ?.filter((fT) => !(LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId] || []).map((t) => t.contractAddress).includes(fT.contractAddress))
            .map((fT) => (
              <TokenElement
                key={fT.contractAddress}
                isLoadingBalances={isLoadingBalances}
                balance={getTokenTotalBalance(fT.contractAddress, stateWallet?.account) || 0}
                name={fT.symbol?.toUpperCase()}
                usdBalance={roundNumber(getTokenUsdBalance(fT.contractAddress), 2)}
                contractAddress={fT.contractAddress}
                onClick={() =>
                  selectedAccountBalance &&
                  openModal({
                    title: `${fT.symbol?.toUpperCase()} ${t('wallet.chainDistribution')}`,
                    content: renderChainDistribution(fT.symbol, fT.contractAddress),
                  })
                }
              />
            ))}
        </DivAssetList>
      </DivAsset>
      <NotificationManager />
    </div>
  );
};
export default Wallet;
