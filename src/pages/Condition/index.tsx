import { useHistory } from 'react-router-dom';
import images from 'src/images';
import styled from 'styled-components';
import { StickyFooter } from 'src/components';
import Button from 'src/components/Buttons';
import { StartBackground } from '../Home';
import { useTranslation } from 'react-i18next';

const DivBody = styled.div`
  width: 100%;
  text-align: left;
  font-size: 20px;
  line-height: 25px;
  display: flex;
  margin-top: 30px;
`;
const Img = styled.img`
  height: 20px;
  width: 20px;
`;
const Body = styled.div`
  height: 100%;
  width: 100%;
  margin-top: 30px;
`;
const TextRight = styled.div`
  width: calc(100% - 2em);
  float: right;
  height: 100%;
  font-size: 16px;
`;
const Icon = styled.div`
  width: 2em;
  height: 100%;
  float: left;
`;
const Condition = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const onNext = () => {
    history.push('/init-seed-phrase');
  };
  return (
    <StartBackground style={{ color: 'white', justifyContent: 'flex-start' }}>
      <div style={{ padding: 24 }}>
        <Body>
          <DivBody>
            <Icon>
              <Img src={images.wallet.checkedV} alt="check-box" />
            </Icon>
            <TextRight>{t('condition.noPersonalInfo')}</TextRight>
          </DivBody>
          <DivBody>
            <Icon>
              <Img src={images.wallet.checkedV} alt="check-box" />
            </Icon>
            <TextRight>{t('condition.noIP')}</TextRight>
          </DivBody>
          <DivBody>
            <Icon>
              <Img src={images.wallet.checkedV} alt="check-box" />
            </Icon>
            <TextRight>{t('condition.noSelling')}</TextRight>
          </DivBody>
        </Body>
        <StickyFooter style={{ background: 'transparent', padding: '20px 0px' }}>
          <Button onClick={onNext} label={t('condition.next')} size="full" style={{ width: '90%', maxWidth: 890 }} />
        </StickyFooter>
      </div>
    </StartBackground>
  );
};
export default Condition;
