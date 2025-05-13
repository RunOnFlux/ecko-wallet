import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '@Components/Buttons';
import { DivFlex, SecondaryLabel } from '@Components/index';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { BodyFullScreen, Header, PageFullScreen } from '@Components/Page';
import { NavigationHeader } from '@Components/NavigationHeader';
import { useTranslation } from 'react-i18next';

const Buy = () => {
  const { t } = useTranslation();
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
      setError(t('buy.error.noAddress'));
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
          setError(t('buy.error.generic'));
        }
      })
      .catch((error) => {
        console.error('Error getting signature:', error);
        setError(t('buy.error.generic'));
      });
  };

  const url = generateOnramperUrl();

  return (
    <PageFullScreen>
      <Header margin="0px" padding="0 20px">
        <NavigationHeader title={t('buy.title')} onBack={goBack} />
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
            <SecondaryLabel>{t('buy.description')}</SecondaryLabel>
            <DivFlex justifyContent="space-between" alignItems="center" gap="10px" margin="30px 0">
              <Button label={t('buy.cancel')} size="full" variant="secondary" onClick={goBack} />
              <Button type="submit" label={t('buy.confirm')} size="full" variant="primary" onClick={() => setIsAccepted(true)} />
            </DivFlex>
          </DivFlex>
        )}
      </BodyFullScreen>
    </PageFullScreen>
  );
};

export default Buy;
