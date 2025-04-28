import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CommonLabel, DivFlex, SecondaryLabel } from 'src/components';
import { Radio } from 'src/components/Radio';
import images from 'src/images';
import { setIsCreateSeedPhrase } from 'src/stores/slices/extensions';
import { TERM_LINK } from 'src/utils/config';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

export const WelcomeBackground = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: 100%;
  color: white;
  background-image: url('/image/start-background.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
`;

const Image = styled.img`
  width: 140px;
  height: 140px;
  margin-top: 78px;
`;
const Div = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
`;
const DivBody = styled.div`
  width: 100%;
  font-size: 16px;
  line-height: 25px;
  display: flex;
  align-items: center;
  padding: 20px;
  flex: 0.2;
`;
const Term = styled.a`
  font-weight: bold;
  text-decoration: none;
  color: #ffffff;
`;
const TermsBr = styled.br`
  @media (min-width: 410px) {
    display: none;
  }
`;
const StartButton = styled(DivFlex)`
  background: linear-gradient(114.43deg, #293445 5.17%, #292a45 65.62%);
  justify-content: flex-start;
  align-items: flex-start;
  border-radius: 25px;
  padding: 25px 16px;
  gap: 13px;
  img {
    width: 22px;
  }
`;

const InitSeedPhrase = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [isChecked, setIsChecked] = useState(false);

  const getCheckboxLabel = () => (
    <CommonLabel color="white">
      {t('initSeedPhrase.agreeTerms')}
      <TermsBr />
      <Term href={TERM_LINK} target="_blank" rel="noreferrer">
        {t('initSeedPhrase.termsOfUse')}
      </Term>
    </CommonLabel>
  );

  const goToCreatePassword = (isHaveSP) => {
    if (isChecked) {
      setIsCreateSeedPhrase(isHaveSP);
      history.push('/create-password');
    }
  };

  return (
    <WelcomeBackground>
      <Div>
        <Image src={images.eckoWalletIcon} size={200} width={200} alt="logo" />
      </Div>
      <DivBody>
        <Radio isChecked={isChecked} label={getCheckboxLabel()} onClick={() => setIsChecked((prev) => !prev)} />
      </DivBody>
      <div style={{ padding: 24, opacity: isChecked ? 1 : 0.2, flex: 1 }}>
        <StartButton onClick={() => goToCreatePassword(false)} style={{ cursor: isChecked ? 'pointer' : 'default' }}>
          <img src={images.wallet.startUser} />
          <DivFlex flexDirection="column">
            <CommonLabel color="#fff" fontWeight={600} fontSize={18}>
              {t('initSeedPhrase.createNewWallet')}
            </CommonLabel>
            <SecondaryLabel>{t('initSeedPhrase.setupNewAccount')}</SecondaryLabel>
          </DivFlex>
        </StartButton>
        <StartButton onClick={() => goToCreatePassword(true)} marginTop="20px" style={{ cursor: isChecked ? 'pointer' : 'default' }}>
          <img src={images.wallet.arrowTransfer} />
          <DivFlex flexDirection="column">
            <CommonLabel color="#fff" fontWeight={600} fontSize={18}>
              {t('initSeedPhrase.restoreWallet')}
            </CommonLabel>
            <SecondaryLabel>{t('initSeedPhrase.restoreFromPhrase')}</SecondaryLabel>
          </DivFlex>
        </StartButton>
      </div>
    </WelcomeBackground>
  );
};
export default InitSeedPhrase;
