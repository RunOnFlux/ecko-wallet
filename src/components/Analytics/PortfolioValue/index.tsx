import { forwardRef } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from 'src/components/Buttons';
import SimpleToast from 'src/components/Toast/SimpleToast';
import { useModalContext } from 'src/contexts/ModalContext';
import { useAppSelector } from 'src/stores/hooks';
import { canTrackPortfolio } from 'src/stores/slices/analytics';
import { DivFlex } from 'src/components';
import images from 'src/images';
import InfoIcon from 'src/images/info.svg?react';
import PortfolioValueApproved from '../PortfolioValueApproved';
import { AnalyticTile, Container } from '../UI';
import Confirm from './Confirm';
import DisclaimerInfo from './DisclaimerInfo';

const Content = styled.div`
  width: 100%;
  height: 240px;
  background: url(${images.analytics.portfolioValueBlurred}) no-repeat center center;
  background-size: 100% 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TrackButton = styled(Button)`
  background: transparent;
  border: 1px solid white;
  color: white;
  margin: 16px;
  width: 100%;
  max-width: 400px;
`;

const ButtonWrapper = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0px;
`;

const PortfolioValue = forwardRef<HTMLDivElement>((_, ref) => {
  const { t } = useTranslation();
  const trackPortfolio = useAppSelector(canTrackPortfolio());
  const { openModal, closeModal } = useModalContext();

  const handleTrackPortfolio = () => {
    openModal({
      title: t('analytics.trackPortfolioTitle'),
      content: <Confirm onConfirm={closeModal} />,
    });
  };

  const onInfo = () => {
    toast.warning(<SimpleToast content={<DisclaimerInfo />} />, {
      autoClose: false,
      toastId: 'portfolioValueApprovedInfo',
    });
  };

  const children = trackPortfolio ? (
    <PortfolioValueApproved />
  ) : (
    <Content>
      <TrackButton label={t('analytics.startTracking')} onClick={handleTrackPortfolio} />
    </Content>
  );

  return (
    <Container ref={ref}>
      <DivFlex flexDirection="row" alignItems="center" gap="12px">
        <AnalyticTile>{t('analytics.portfolioValue')}</AnalyticTile>
        <ButtonWrapper onClick={onInfo}>
          <InfoIcon width={24} height={24} />
        </ButtonWrapper>
      </DivFlex>
      {children}
    </Container>
  );
});

export default PortfolioValue;
