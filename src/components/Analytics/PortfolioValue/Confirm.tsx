import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { DivFlex, SecondaryLabel } from 'src/components';
import Button from 'src/components/Buttons';
import { useAppDispatch } from 'src/stores/hooks';
import { startTrackPortfolio } from 'src/stores/slices/analytics';
import Disclaimer from './Disclaimer';

const Subtitle = styled(SecondaryLabel)`
  text-transform: uppercase;
  color: #a0a6aa;
  font-weight: bold;
`;

const Description = styled(SecondaryLabel)`
  font-weight: 300;
  font-size: 14px;
  margin-bottom: 8px;
`;

const Separator = styled.div`
  margin: 8px 0px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const Confirm = ({ onConfirm }: ConfirmProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    dispatch(startTrackPortfolio());
    onConfirm?.();
  };

  return (
    <DivFlex flexDirection="column" padding="24px" paddingTop="0px" gap="8px">
      <Subtitle>{t('analytics.trackPortfolioStart')}</Subtitle>
      <Description>{t('analytics.trackPortfolioDesc1')}</Description>
      <Description>{t('analytics.trackPortfolioDesc2')}</Description>
      <Separator />
      <Disclaimer />
      <DivFlex justifyContent="center" padding="4px" paddingTop="8px">
        {loading ? (
          <Button label={t('analytics.confirming')} size="full" variant="primary" disabled />
        ) : (
          <Button label={t('analytics.confirm')} size="full" variant="primary" onClick={handleConfirm} />
        )}
      </DivFlex>
    </DivFlex>
  );
};

interface ConfirmProps {
  onConfirm?: () => void;
}

export default Confirm;
