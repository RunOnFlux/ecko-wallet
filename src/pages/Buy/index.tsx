import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '@Components/Buttons';
import { DivFlex, SecondaryLabel } from '@Components/index';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { BodyFullScreen, Header, PageFullScreen } from '@Components/Page';
import { NavigationHeader } from '@Components/NavigationHeader';

const Buy = () => {
  const { account: walletAddress } = useCurrentWallet();
  const [isAccepted, setIsAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [payloadToSign, setPayloadToSign] = useState('');
  const [error, setError] = useState<string | null>(null);

  const history = useHistory();

  const goBack = () => {
    history.push('/');
  };

  const { theme } = useAppThemeContext();

  const params: Record<string, string> = {
    apiKey: 'pk_prod_01JDMCZ0ZRZ14VBRW20B4HC04V',
    mode: 'buy,sell',
    onlyCryptoNetworks: 'kadena',
    defaultCrypto: 'KDA',
    sell_onlyCryptoNetworks: 'kadena',
    sell_defaultCrypto: 'KDA',
    themeName: theme.isDark ? 'dark' : 'light',
    containerColor: theme.background.replace('#', ''),
    primaryColor: theme.button.primary.replace('#', ''),
    primaryTextColor: theme.text.primary.replace('#', ''),
    secondaryTextColor: theme.text.primary.replace('#', ''),
    primaryBtnTextColor: 'ffffff',
    borderRadius: '0',
    wgBorderRadius: '0',
  };

  const generateOnramperUrl = () => {
    return `https://buy.onramper.com?${new URLSearchParams(params).toString()}&${payloadToSign}&signature=${signature}`;
  };

  useEffect(() => {
    if (walletAddress) {
      setPayloadToSign(`wallets=kadena:${walletAddress}`);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isAccepted && walletAddress && !signature) {
      askForSignature();
    }
  }, [isAccepted, walletAddress, signature]);

  const askForSignature = async () => {
    if (!payloadToSign) {
      setError('Wallet address not available');
      return;
    }

    fetch(`https://relay.sspwallet.io/v1/sign/onramper`, { method: 'POST', body: payloadToSign })
      .then((response) => response.json())
      .then((signatureResponse) => {
        if (signatureResponse.signature) {
          setSignature(signatureResponse.signature);
          setError(null);
        } else {
          console.error('Error getting signature:', error);
          setError('Unable to connect to the service. Please try again later.');
        }
      })
      .catch((error) => {
        console.error('Error getting signature:', error);
        setError('Unable to connect to the service. Please try again later.');
      });
  };
  const url = `${generateOnramperUrl()}`;
  console.dir(url, { depth: null, maxStringLength: Infinity });
  return (
    <PageFullScreen>
      <Header margin="0px" padding="0 20px">
        <NavigationHeader title="Buy" onBack={goBack} />
      </Header>
      <BodyFullScreen>
        {isAccepted && payloadToSign && signature ? (
          <DivFlex flexDirection="column" style={{ textAlign: 'center', height: '100%' }}>
            <iframe
              src={url}
              title="Onramper"
              height="100%"
              width="100%"
              allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{
                border: 'none',
                margin: '-6px',
                borderRadius: '5px',
              }}
            />
          </DivFlex>
        ) : (
          <DivFlex flexDirection="column" justifyContent="space-evenly" padding="20px" style={{ height: '100%' }}>
            <SecondaryLabel>
              The purchase and sale of cryptocurrencies are facilitated through a third-party service provided by Onramper. <br /> <br />
              While eckoWallet is committed to ensuring the highest level of security for its users, we cannot guarantee the security and privacy of
              third-party services.
            </SecondaryLabel>
            <DivFlex justifyContent="space-between" alignItems="center" gap="10px" margin="30px 0">
              <Button label="Cancel" size="full" variant="secondary" onClick={() => goBack()} />
              <Button type="submit" label="Confirm" size="full" variant="primary" onClick={() => setIsAccepted(true)} />
            </DivFlex>
          </DivFlex>
        )}
      </BodyFullScreen>
    </PageFullScreen>
  );
};

export default Buy;
