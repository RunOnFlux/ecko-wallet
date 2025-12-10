import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { DivFlex, SecondaryLabel } from 'src/components';

const GasSettingsContainer = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: ${({ theme }) => theme.card?.background || theme.background};
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  border-radius: 8px;
`;

const GasRow = styled(DivFlex)`
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const GasInput = styled.input`
  width: 140px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text?.primary};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary || '#ffa900'};
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
`;

interface GasSettingsProps {
  gasPrice: string;
  gasLimit: string;
  onGasPriceChange: (value: string) => void;
  onGasLimitChange: (value: string) => void;
}

const GasSettings = ({ gasPrice, gasLimit, onGasPriceChange, onGasLimitChange }: GasSettingsProps) => {
  const { t } = useTranslation();

  return (
    <GasSettingsContainer>
      <SecondaryLabel fontSize={12} fontWeight={700} uppercase style={{ marginBottom: 12 }}>
        {t('swap.gasSettings', 'Gas Settings')}
      </SecondaryLabel>
      <GasRow justifyContent="space-between" alignItems="center">
        <SecondaryLabel fontSize={12}>{t('swap.gasPrice', 'Gas price')}</SecondaryLabel>
        <GasInput value={gasPrice} onChange={(e) => onGasPriceChange(e.target.value)} type="number" min="0" step="0.00000001" />
      </GasRow>
      <GasRow justifyContent="space-between" alignItems="center">
        <SecondaryLabel fontSize={12}>{t('swap.gasLimit', 'Gas limit')}</SecondaryLabel>
        <GasInput value={gasLimit} onChange={(e) => onGasLimitChange(e.target.value)} type="number" min="0" step="1" />
      </GasRow>
    </GasSettingsContainer>
  );
};

export default GasSettings;

