import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../../stores/hooks';
import { fetchLocal, fetchTokenList } from '@Utils/chainweb';
import { DivFlex, SecondaryLabel } from '@Components/index';
import { TokenElement } from './TokenElement';
import { DivAssetList } from '..';
import images from 'src/images';
import { humanReadableNumber, shortenAddress } from '@Utils/index';
import Spinner from '@Components/Spinner';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import useLocalStorage from 'src/hooks/useLocalStorage';
import { IFungibleTokensByNetwork, LOCAL_DEFAULT_FUNGIBLE_TOKENS, LOCAL_KEY_FUNGIBLE_TOKENS } from 'src/pages/ImportToken';

interface DetectedToken {
  contract: string;
  balance: number;
  chainId: number;
}

export const TokenDetector = ({ onTokenSelect }: { onTokenSelect: (token: { contract: string; balance: number }) => void }) => {
  const { t } = useTranslation();
  const { theme } = useAppThemeContext();
  const [loading, setLoading] = useState(true);
  const [detectedTokens, setDetectedTokens] = useState<DetectedToken[]>([]);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const { account } = useAppSelector((state) => state.wallet);
  const [tokens, setTokens] = useState<string[]>([]);

  const [fungibleTokens, setFungibleTokens] = useLocalStorage<IFungibleTokensByNetwork>(LOCAL_KEY_FUNGIBLE_TOKENS, LOCAL_DEFAULT_FUNGIBLE_TOKENS);
  const fungibleTokensByNetwork = (fungibleTokens && fungibleTokens[selectedNetwork?.networkId]) || [];

  useEffect(() => {
    const init = async () => {
      if (selectedNetwork && selectedNetwork.url) {
        const allTokens = await fetchTokenList();
        setTokens([...allTokens]);
      }
    };
    init();
  }, [selectedNetwork]);

  useEffect(() => {
    if (tokens.length) {
      fetchTokenBalancesByChain();
    }
  }, [tokens]);

  const fetchTokenBalancesByChain = async () => {
    const tokenBalances = {};
    const chainPromises: any = [];

    for (let chainId = 0; chainId < 20; chainId++) {
      const chainTokens: any = tokens[chainId] || [];

      if (chainTokens.length === 0) continue;

      const pactCode = `
        (let*
          (
            ${chainTokens
              .map((token) => {
                const tokenAlias = token.replace(/\./g, '');
                return `(${tokenAlias} (try 0.0 (${token}.get-balance "${account}")))`;
              })
              .join('\n')}
          )
          {
            ${chainTokens.map((token) => `"${token}": ${token.replace(/\./g, '')}`).join(',\n')}
          }
        )
      `;

      const chainPromise = fetchLocal(pactCode, selectedNetwork?.url, selectedNetwork?.networkId, chainId.toString())
        .then((result) => {
          if (result?.result?.status === 'success') {
            const balances = result.result.data;
            Object.keys(balances).forEach((tokenContract) => {
              const balance = parseFloat(balances[tokenContract]);
              if (balance > 0) {
                if (tokenBalances[tokenContract]) {
                  tokenBalances[tokenContract].balance += balance;
                  tokenBalances[tokenContract].chains.push(chainId);
                } else {
                  tokenBalances[tokenContract] = {
                    contract: tokenContract,
                    balance: balance,
                    chains: [chainId],
                  };
                }
              }
            });
          }
        })
        .catch((error) => {
          console.error(`Error fetching balances for chain ${chainId}:`, error);
        });

      chainPromises.push(chainPromise);
    }

    await Promise.all(chainPromises);

    const allTokensWithBalance: DetectedToken[] = Object.values(tokenBalances);
    setDetectedTokens(
      allTokensWithBalance.filter((t) => t.contract !== 'coin' && !fungibleTokensByNetwork?.find((f) => f.contractAddress === t.contract)),
    );
    setLoading(false);

    return allTokensWithBalance;
  };

  const renderTokenOptions = () => {
    return detectedTokens.map((token) => (
      <TokenElement
        key={token.contract}
        contractAddress={token.contract}
        rightText={humanReadableNumber(token.balance, 5)}
        name={shortenAddress(token.contract, 5, 15)}
        onClick={() => onTokenSelect(token)}
      />
    ));
  };

  return (
    <DivFlex flexDirection="column" justifyContent="center" alignItems="center" style={{ minHeight: 100, padding: '0px 20px' }}>
      {loading ? (
        <Spinner size={10} color={theme?.text?.secondary} weight={2} />
      ) : detectedTokens.length > 0 ? (
        <DivAssetList style={{ width: '100%' }}>{renderTokenOptions()}</DivAssetList>
      ) : (
        <SecondaryLabel>{t('tokenDetector.noTokensFound')}</SecondaryLabel>
      )}
    </DivFlex>
  );
};

export default TokenDetector;
