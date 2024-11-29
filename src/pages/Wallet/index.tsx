/* eslint-disable react/jsx-curly-newline */
import { useHistory } from 'react-router-dom';
import images from 'src/images';
import SearchIconSVG from 'src/images/search.svg';
import AddIconSVG from 'src/images/add-round.svg';
import styled from 'styled-components';
import AlertIconSVG from 'src/images/icon-alert.svg';
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
import KDXGovernanceMiningButton from 'src/components/GovernanceMining/KDXButton';
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

const DivAsset = styled.div`
  padding: 20px;
  margin-bottom: 60px;
`;
const DivAssetList = styled.div`
  .token-element {
    border-top: 1px solid ${({ theme }) => theme?.border};
  }
  .token-element:first-child {
    border-top: none;
  }
`;

const Wallet = () => {
  const history = useHistory();
  const { openModal, closeModal } = useModalContext();
  const { isLoadingBalances, selectedAccountBalance, allAccountsBalance, allAccountsBalanceUsd } = useAccountBalanceContext();
  const rootState = useAppSelector((state) => state);
  const { selectedNetwork } = rootState.extensions;
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
    toast.success(<Toast type="success" content="Token successfully removed" />);
    closeModal();
  };

  const renderChainDistribution = (symbol: string, contractAddress: string) => {
    const isNonTransferable = NON_TRANSFERABLE_TOKENS.some((nonTransf) => nonTransf === contractAddress);
    const hasBalance = getTokenChainDistribution(contractAddress).filter((cD) => cD.balance > 0)?.length > 0;
    return (
      <div style={{ padding: 20 }}>
        {isNonTransferable ? (
          <Warning justifyContent="center" type="danger" margin="-20px 0px 10px 0px">
            <AlertIconSVG />
            <div>
              <span>{contractAddress} is not transferable!</span>
            </div>
          </Warning>
        ) : null}
        {symbol?.toLowerCase() === 'kdx' && <KDXGovernanceMiningButton onClick={closeModal} />}
        {getTokenChainDistribution(contractAddress)
          .filter((cD) => cD.balance > 0)
          .map((cD) => (
            <TokenChainBalance
              name={symbol}
              isNonTransferable={isNonTransferable}
              contractAddress={contractAddress}
              chainId={cD.chainId}
              balance={cD.balance}
              usdBalance={getTokenUsdBalance(contractAddress, cD.chainId)}
            />
          ))}
        {!hasBalance && symbol?.toLowerCase() === 'kda' ? (
          <Warning justifyContent="center">Doesn’t exist: This account does not exist.</Warning>
        ) : null}
        {!hasBalance && symbol?.toLowerCase() !== 'kda' ? <Warning justifyContent="center">{symbol?.toUpperCase()} balance is 0.</Warning> : null}
        {['coin', 'kaddex.kdx'].every((add) => add !== contractAddress) && (
          <ActionList
            actions={[
              {
                src: images.settings.iconTrash,
                label: 'Remove token',
                onClick: () =>
                  openModal({
                    title: `Remove ${symbol.toUpperCase()} token`,
                    content: (
                      <ConfirmModal
                        text={`Are you sure you want remove ${symbol.toUpperCase()} token?`}
                        onClose={closeModal}
                        onConfirm={() => handleRemoveToken(contractAddress)}
                      />
                    ),
                  }),
              },
              {
                src: images.settings.iconEdit,
                label: 'Edit token',
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
        <SecondaryLabel>NET WORTH</SecondaryLabel>
        <SecondaryLabel color={theme.text?.primary}>
          {isLoadingBalances ? (
            <Spinner size={10} color={theme.text?.primary} weight={2} />
          ) : (
            `$ ${humanReadableNumber(getAllChainUsdBalance().toFixed(2), 2)}`
          )}
        </SecondaryLabel>
      </DivFlex>
      <DivBottomShadow justifyContent="center" flexDirection="column" alignItems="center" padding="20px">
        <SecondaryLabel>ACCOUNT BALANCE</SecondaryLabel>
        <PrimaryLabel>$ {humanReadableNumber(getAccountBalance(stateWallet?.account).toFixed(2), 2)}</PrimaryLabel>
        <DivFlex justifyContent="space-around" style={{ width: '100%', marginTop: 30 }}>
          <CircledButton
            onClick={() => history.push('/transfer?coin=kda&chainId=0')}
            label="Send"
            iconUrl={images.wallet.arrowSend}
            variant="primary"
          />
          <CircledButton
            onClick={() => openModal({ title: 'Receive tokens', content: <ReceiveModal /> })}
            label="Receive"
            iconUrl={images.wallet.arrowReceive}
            variant="secondary"
          />
          <CircledButton onClick={handleHistory} label="History" iconUrl={images.iconHistory} variant="empty" />
        </DivFlex>
      </DivBottomShadow>
      <DivAsset>
        <DivFlex justifyContent="space-between">
          <SecondaryLabel style={{ paddingTop: 10 }}>ASSETS</SecondaryLabel>
          <DivFlex>
            {selectedNetwork.networkId === MAINNET_NETWORK_ID && (
              <IconButton onClick={() => openModal({ title: 'Token list', content: <AssetsList /> })} svgComponent={<SearchIconSVG />} />
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
            logo={images.wallet.tokens.coin}
            onClick={() => selectedAccountBalance && openModal({ title: 'KDA Chain Distribution', content: renderChainDistribution('kda', 'coin') })}
          />
          {LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId] &&
            LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId].map((t) => (
              <TokenElement
                key={t.contractAddress}
                isLoadingBalances={isLoadingBalances}
                balance={getTokenTotalBalance(t.contractAddress, stateWallet?.account)}
                name={t.symbol?.toLocaleUpperCase()}
                usdBalance={roundNumber(getTokenUsdBalance(t.contractAddress), 2)}
                logo={images.wallet.tokens[t.contractAddress]}
                onClick={() =>
                  selectedAccountBalance &&
                  openModal({
                    title: `${t.symbol.toLocaleUpperCase()} Chain Distribution`,
                    content: renderChainDistribution(t.symbol, t.contractAddress),
                  })
                }
              />
            ))}

          {fungibleTokensByNetwork
            ?.filter(
              (fT) =>
                !(LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId] && LOCAL_DEFAULT_FUNGIBLE_TOKENS[networkId])
                  .map((t) => t.contractAddress)
                  .includes(fT.contractAddress),
            )
            ?.map((fT) => {
              const tokenBalance = getTokenTotalBalance(fT.contractAddress, stateWallet?.account);
              return (
                <TokenElement
                  key={fT.contractAddress}
                  isLoadingBalances={isLoadingBalances}
                  balance={tokenBalance || 0}
                  name={fT.symbol?.toUpperCase()}
                  usdBalance={roundNumber(getTokenUsdBalance(fT.contractAddress), 2)}
                  logo={images.wallet.tokens[fT.contractAddress] || images.wallet.iconUnknownKadenaToken}
                  onClick={() => {
                    selectedAccountBalance &&
                      openModal({
                        title: `${fT.symbol?.toUpperCase()} Chain Distribution`,
                        content: renderChainDistribution(fT.symbol, fT.contractAddress),
                      });
                  }}
                />
              );
            })}
        </DivAssetList>
      </DivAsset>
      <NotificationManager />
    </div>
  );
};
export default Wallet;
