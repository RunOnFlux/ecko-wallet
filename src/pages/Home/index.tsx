import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SecondaryLabel, StickyFooter } from 'src/components';
import EckoWalletLogo from '../../images/ecko-wallet-logo.svg?react';
import styled from 'styled-components';
import Button from '../../components/Buttons';
import { LanguageSelector } from '@Components/LanguageSelector';
import { RUNONFLUX_LINK } from '@Utils/config';
import images from 'src/images';
import { useGoldCashbackEmbed } from 'src/utils/bring';
import GoldCashbackBlock from 'src/components/GoldCashback';

const Wrapper = styled.div`
  text-align: center;
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  @media screen and (max-width: 1024px) {
    height: auto;
    margin-top: 100px;
  }
`;
export const StartBackground = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
  background-image: url('/image/init-background.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
`;
const DivImage = styled.div`
  font-size: ${(props) => props.fontSize};
  color: ${(props) => props.color};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: ${(props) => props.fontWeight};
  margin-top: ${(props) => props.marginTop};
  margin-bottom: ${(props) => props.marginBottom};
`;

const PoweredByFlux = styled.img<{ size: string; top: string; width: string }>`
  width: ${($props) => $props.width};
  margin: 10px 0;
`;

// Ecko's part under the Gold Cashback block: a smaller logo so everything fits in the popup.
const CompactWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 0 100px;
`;

const HomePage = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const goldCashback = useGoldCashbackEmbed();
  const goToTermsCondition = () => {
    history.push('/term-condition');
  };
  const hasGoldCashback = goldCashback.status !== 'unavailable';
  return (
    <StartBackground style={hasGoldCashback ? { justifyContent: 'flex-start', minHeight: '100vh' } : undefined}>
      {hasGoldCashback ? (
        <>
          <GoldCashbackBlock embed={goldCashback} />
          <CompactWrapper>
            <EckoWalletLogo style={{ width: 60, height: 50 }} />
            <a href={RUNONFLUX_LINK} target="_blank" rel="noreferrer">
              <PoweredByFlux src={images.poweredByFlux} width={90} alt="Powered by Flux" />
            </a>
            <LanguageSelector />
          </CompactWrapper>
        </>
      ) : (
        <Wrapper>
          <DivImage marginBottom="120px">
            <EckoWalletLogo style={{ width: 200 }} />
            <a href={RUNONFLUX_LINK} target="_blank" rel="noreferrer">
              <PoweredByFlux src={images.poweredByFlux} width={100} alt="Powered by Flux" />
            </a>
            <SecondaryLabel>The Kadena ecosystem gateway</SecondaryLabel>
          </DivImage>
          <LanguageSelector />
        </Wrapper>
      )}
      <StickyFooter style={{ background: 'transparent', padding: '20px 0px' }}>
        <Button
          size="full"
          variant="disabled"
          onClick={goToTermsCondition}
          label={t('home.startNow')}
          style={{ width: '90%', maxWidth: 890, cursor: 'pointer' }}
        />
      </StickyFooter>
    </StartBackground>
  );
};
export default HomePage;
