import styled from 'styled-components';
import images from 'src/images';
import { useHistory } from 'react-router-dom';
import { Header } from 'src/components/Header';
import { PrimaryLabel, SecondaryLabel } from 'src/components';
import { useTranslation } from 'react-i18next';

const CreateInitPageWrapper = styled.div`
  padding: 0 20px;
  text-align: center;
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  @media screen and (max-width: 1024px) {
    height: auto;
    margin-top: 100px;
  }
`;
const Body = styled.div`
  font-size: 16px;
`;
const Image = styled.img`
  height: 155px;
  width: 155px;
  cursor: pointer;
`;
const DivChild = styled.div`
  margin-top: 50px;
  margin-bottom: 20px;
`;

const InitPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const goToImport = () => {
    history.push('/import-wallet');
  };

  return (
    <>
      <Header hideAccounts />
      <CreateInitPageWrapper>
        <Body>
          <SecondaryLabel fontSize={14}>{t('initPage.secondary.existingKey')}</SecondaryLabel>
          <br />
          <SecondaryLabel fontSize={14}>{t('initPage.secondary.prompt')}</SecondaryLabel>
          <DivChild>
            <Image src={images.initPage.importPrivateKey} alt={t('initPage.image.alt')} onClick={goToImport} />
          </DivChild>
          <PrimaryLabel>{t('initPage.button.import')}</PrimaryLabel>
        </Body>
      </CreateInitPageWrapper>
    </>
  );
};

export default InitPage;
