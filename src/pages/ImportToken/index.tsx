import { useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { useForm } from 'react-hook-form';
import useLocalStorage from 'src/hooks/useLocalStorage';
import { BaseTextInput, InputError } from 'src/baseComponent';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import { fetchListLocal } from 'src/utils/chainweb';
import { hideLoading, showLoading } from 'src/stores/slices/extensions';
import { KNOWN_TOKENS } from 'src/utils/constant';
import { SettingsContext } from 'src/contexts/SettingsContext';
import { useGoHome } from 'src/hooks/ui';
import Button from 'src/components/Buttons';
import { NavigationHeader } from 'src/components/NavigationHeader';
import { useAppSelector } from 'src/stores/hooks';

export const LOCAL_KEY_FUNGIBLE_TOKENS = 'fungibleTokensByNetworkv2';
export const LOCAL_DEFAULT_FUNGIBLE_TOKENS = {
  mainnet01: [
    { contractAddress: 'runonflux.flux', symbol: 'flux' },
    { contractAddress: 'n_b742b4e9c600892af545afb408326e82a6c0c6ed.zUSD', symbol: 'zUSD' },
  ],
  testnet04: [{ contractAddress: 'n_dd05101ff4df21179bfc038a912fc88c38d777a1.kdx', symbol: 'kdx' }],
  development: [],
};

export interface IFungibleToken {
  contractAddress: string;
  symbol: string;
}

export interface IFungibleTokensByNetwork {
  [network: string]: IFungibleToken[];
}

const ImportTokenWrapper = styled.div`
  padding: 0 20px;
`;
const Body = styled.div`
  height: auto;
  width: 100%;
`;
const DivBody = styled.div`
  width: 100%;
  text-align: left;
  font-size: 20px;
  display: flex;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
`;
const ButtonSubmit = styled(Button)``;
const Footer = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 50px;
  @media screen and (max-width: 480px) {
    margin-top: 25px;
  }
`;
const ImportToken = () => {
  const stateWallet = useCurrentWallet();
  const { search } = useLocation();
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const networkId = selectedNetwork?.networkId;
  const goHome = useGoHome();
  const [fungibleTokens, setFungibleTokens] = useLocalStorage<IFungibleTokensByNetwork>(LOCAL_KEY_FUNGIBLE_TOKENS, LOCAL_DEFAULT_FUNGIBLE_TOKENS);
  const { data: settings } = useContext(SettingsContext);
  const txSettings = settings?.txSettings;

  const fungibleTokensByNetwork = (fungibleTokens && fungibleTokens[networkId]) || [];

  const params = new URLSearchParams(search);
  const coin = params.get('coin');
  const suggest = params.get('suggest');
  const token = fungibleTokensByNetwork?.find((ft) => ft.contractAddress === coin);

  const checkTokenExists = async (contractAddress: string) => {
    showLoading();
    const { account } = stateWallet;
    const pactCode = `(${contractAddress}.details "${account}")`;
    for (let i = 0; i < 20; i += 1) {
      try {
        /* eslint-disable no-await-in-loop */
        const res = await fetchListLocal(pactCode, selectedNetwork.url, selectedNetwork.networkId, i, txSettings?.gasPrice, txSettings?.gasLimit);
        if (
          res?.result?.error?.message?.includes('row not found') ||
          res?.result?.error?.message?.includes('No value found in table') ||
          res?.result?.status === 'success'
        ) {
          hideLoading();
          return true;
        }
        // contractAddress not exists on chain i
      } catch (err) {
        // contractAddress not exists on chain i
      }
    }
    hideLoading();
    return false;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm();

  useEffect(() => {
    if (token) {
      setValue('contractAddress', token.contractAddress);
      setValue('symbol', token.symbol);
    }
  }, [token]);

  useEffect(() => {
    if (suggest) {
      setValue('contractAddress', suggest);
    }
  }, []);

  const onImport = async (fT: IFungibleToken | any) => {
    const alreadyExists = fungibleTokensByNetwork?.find((fungToken) => fungToken.contractAddress === fT.contractAddress);
    if (!token && alreadyExists) {
      toast.error(<Toast type="error" content="Token already added" />);
    } else {
      const tokenExists = await checkTokenExists(fT.contractAddress);
      if (!tokenExists) {
        toast.error(<Toast type="error" content={`Cannot resolve ${fT.contractAddress}.details - Please check the token exists on ${networkId}`} />);
      } else {
        let newFungibleTokens = fungibleTokensByNetwork || [];
        if (token) {
          newFungibleTokens = fungibleTokensByNetwork?.filter((ft) => ft.contractAddress !== token.contractAddress) ?? [];
        }
        setFungibleTokens({
          ...fungibleTokens,
          [networkId]: [
            ...newFungibleTokens,
            {
              ...fT,
              symbol: fT.symbol?.toLowerCase(),
            },
          ],
        });
        toast.success(<Toast type="success" content="Token successfully saved" />);
        goHome();
      }
    }
  };
  return (
    <ImportTokenWrapper>
      <NavigationHeader title="Import Tokens" />
      <Body>
        <form onSubmit={handleSubmit(onImport)} id="import-token-form">
          <DivBody>
            <BaseTextInput
              inputProps={{
                placeholder: 'Input Contract Address',
                ...register('contractAddress', {
                  required: {
                    value: true,
                    message: 'This field is required.',
                  },
                  validate: {
                    required: (val) => val.trim().length > 0 || 'Invalid data',
                  },
                }),
              }}
              title="Token Contract Address"
              height="auto"
              onChange={(e) => {
                clearErrors('contractAddress');
                setValue('contractAddress', e.target.value);
                if (KNOWN_TOKENS[e.target.value] && KNOWN_TOKENS[e.target.value]?.symbol) {
                  clearErrors('symbol');
                  setValue('symbol', KNOWN_TOKENS[e.target.value]?.symbol);
                } else {
                  clearErrors('symbol');
                  setValue('symbol', '');
                }
              }}
            />
            {errors.contractAddress && <InputError>{errors.contractAddress.message}</InputError>}
          </DivBody>
          <DivBody>
            <BaseTextInput
              inputProps={{
                placeholder: 'Input Symbol',
                ...register('symbol', {
                  required: {
                    value: true,
                    message: 'This field is required.',
                  },
                  validate: {
                    required: (val) => val.trim().length > 0 || 'Invalid data',
                  },
                }),
              }}
              title="Token Symbol"
              height="auto"
              onChange={(e) => {
                clearErrors('symbol');
                setValue('symbol', e.target.value);
              }}
            />
            {errors.symbol && <InputError>{errors.symbol.message}</InputError>}
          </DivBody>
        </form>
      </Body>
      <Footer>
        <ButtonSubmit variant="primary" size="full" form="import-token-form" label={`${token ? 'Edit' : 'Add'} Token`} />
      </Footer>
    </ImportTokenWrapper>
  );
};

export default ImportToken;
