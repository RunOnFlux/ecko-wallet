import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import AlertIconSVG from 'src/images/icon-alert.svg?react';

const Container = styled.div`
  margin-bottom: 24px;
  background: ${({ theme }) => theme.alert.background};
  color: ${({ theme }) => theme.alert.color};
  padding: 10px;
  border-radius: 10px;
  display: flex;
  svg {
    margin-right: 10px;
    path {
      fill: #ffa900;
    }
  }
`;

const Info = styled.div`
  width: calc(100% - 32px);
`;

const InfoCaption = styled.div`
  text-align: left;
  font-size: 12px;
  padding-bottom: 8px;
  font-weight: bold;
`;

const InfoText = styled.div`
  text-align: left;
  font-size: 11px;
  font-weight: normal;
`;

const Disclaimer = () => {
  const { t } = useTranslation();

  return (
    <Container>
      <AlertIconSVG />
      <Info>
        <InfoCaption>{t('analytics.disclaimerTitle')}</InfoCaption>
        <InfoText>{t('analytics.disclaimerText')}</InfoText>
      </Info>
    </Container>
  );
};

export default Disclaimer;
