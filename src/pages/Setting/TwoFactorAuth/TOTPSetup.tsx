import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import styled from 'styled-components';
import { hash } from '@kadena/cryptography-utils';
import { InputError } from 'src/baseComponent';
import { SInput } from 'src/baseComponent/BaseTextInput';
import { LabelWithLink } from 'src/components';
import Button from 'src/components/Buttons';
import { NavigationHeader } from 'src/components/NavigationHeader';
import { SeedPhraseRetrivier } from 'src/components/SeedPhraseRetrivier';
import Toast from 'src/components/Toast/Toast';
import { encryptSharedKey, generateSharedKey, initTOTP } from 'src/utils/totp';
import { useAppDispatch } from 'src/stores/hooks';
import { setTOTPSharedKey } from 'src/stores/slices/auth';
import { Body, Footer, Page } from 'src/components/Page';
import { useTranslation } from 'react-i18next';

const GA_LINK = 'https://support.google.com/accounts/answer/1066447?hl=en';

const StepWrapper = styled.div`
  margin-bottom: 32px;
`;

const QRCodeWrapper = styled.div`
  background: white;
  padding: 16px;
  width: fit-content;
  margin: 20px auto;
`;

const TokenInput = styled(SInput)`
  width: 200px;
`;

const TokenInputWrapper = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 10px;
`;

const TOTPSetup = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [password, setPassword] = useState('');
  const [sharedKey, setSharedKey] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!sharedKey) {
      setSharedKey(generateSharedKey());
    }
  }, [sharedKey]);

  const goBack = () => {
    history.goBack();
  };

  const onSeedPhraseRetrivied = (_seedPhrase, _password) => setPassword(_password);

  const onChangeInput = (e) => {
    setToken(e.target.value.replace(/\D/g, ''));
  };

  const totp = initTOTP(sharedKey);
  const uri = totp.toString();

  const is6Digits = token.match(/^\d{6}$/);
  const isValidToken = is6Digits ? totp.validate({ token, window: 0 }) !== null : false;

  const handleSave = () => {
    if (!isValidToken || isLoading) return;
    setIsLoading(true);

    const passwordHash = hash(password);
    const encryptedSharedKey = encryptSharedKey(sharedKey, passwordHash);
    dispatch(setTOTPSharedKey(encryptedSharedKey));
    goBack();
    toast.success(<Toast type="success" content={t('settings.2faPage.setupSuccess')} />);
  };

  return (
    <Page>
      <NavigationHeader title={t('settings.2faPage.title')} onBack={goBack} />
      {password ? (
        <>
          <Body>
            <StepWrapper>
              <LabelWithLink fontSize={18}>
                1. {t('settings.2faPage.installApp')}{' '}
                <a href={GA_LINK} target="_blank" rel="noreferrer">
                  Google Authenticator
                </a>{' '}
                {t('settings.2faPage.orSimilar')}
              </LabelWithLink>
            </StepWrapper>
            <StepWrapper>
              <LabelWithLink fontSize={18}>{t('settings.2faPage.scanQRCode')}</LabelWithLink>
              <QRCodeWrapper>
                <QRCode value={uri} />
              </QRCodeWrapper>
            </StepWrapper>
            <StepWrapper>
              <LabelWithLink fontSize={18}>{t('settings.2faPage.enter6Digits')}</LabelWithLink>
              <TokenInputWrapper>
                <TokenInput
                  placeholder="000 000"
                  onChange={onChangeInput}
                  onKeyPress={(event) => {
                    if (event.key === 'Enter') {
                      handleSave();
                    }
                  }}
                />
              </TokenInputWrapper>
              {is6Digits && !isValidToken && <InputError>{t('settings.2faPage.invalidCode')}</InputError>}
            </StepWrapper>
          </Body>
          <Footer>
            <Button
              onClick={handleSave}
              isDisabled={!isValidToken || isLoading}
              label={t('settings.2faPage.saveButton')}
              size="full"
              variant="primary"
            />
          </Footer>
        </>
      ) : (
        <SeedPhraseRetrivier onSuccess={onSeedPhraseRetrivied} />
      )}
    </Page>
  );
};

export default TOTPSetup;
