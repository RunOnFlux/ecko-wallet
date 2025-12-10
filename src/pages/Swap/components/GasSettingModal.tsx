import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { DivFlex, SecondaryLabel } from 'src/components';
import { useSwapContext } from 'src/contexts/SwapContext';
import RadioButtons from './RadioButtons';
import BaseTextInput from 'src/baseComponent/BaseTextInput';

const ModalContent = styled.div`
  padding: 20px;
  color: ${({ theme }) => theme.text?.primary};
  box-sizing: border-box;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
`;

const Header = styled(DivFlex)`
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  padding-bottom: 20px;
  margin-bottom: 20px;
`;

const GasStationLabel = styled(SecondaryLabel)`
  font-size: 14px;
  font-weight: 600;
`;

const SwitchContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: ${({ theme }) => theme.brand || '#ed1cb5'};
  }

  &:checked + span:before {
    transform: translateX(22px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #767577;
  transition: 0.3s;
  border-radius: 28px;

  &:before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

const InputWrapper = styled.div`
  margin-bottom: 24px;
`;

const InfoSection = styled(DivFlex)`
  border-top: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  padding-top: 20px;
  margin-top: 25px;
  justify-content: space-between;
  align-items: flex-start;
`;

const InfoTitle = styled(SecondaryLabel)`
  font-size: 14px;
  flex: 1;
  margin-right: 12px;
`;

const InfoValue = styled(SecondaryLabel)<{ color?: string }>`
  font-size: 15px;
  text-align: right;
  color: ${({ color, theme }) => color || theme.text?.primary};
`;

const NoGasCostText = styled(SecondaryLabel)`
  font-size: 14px;
  margin-top: 20px;
`;

type Speed = 'low' | 'normal' | 'fast';

const speedValues: Speed[] = ['low', 'normal', 'fast'];

const GAS_OPTIONS = {
  low: { gasPrice: 0.000001, gasLimit: 10000 },
  normal: { gasPrice: 0.000001, gasLimit: 10000 },
  fast: { gasPrice: 0.000001, gasLimit: 10000 },
};

interface GasSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GasSettingModal = ({ isOpen, onClose }: GasSettingModalProps) => {
  const { t } = useTranslation();
  const { enableGasStation, setEnableGasStation, gasPrice, gasLimit, setGasPrice, setGasLimit } = useSwapContext();
  const [speed, setSpeed] = useState<Speed>('low');

  const gasConfig = { gasPrice: Number(gasPrice), gasLimit: Number(gasLimit) };
  const gasFee = gasConfig.gasPrice * gasConfig.gasLimit;
  const color =
    gasFee > 0.5 ? '#ff0000' : gasFee <= 0.5 && gasFee > 0.01 ? '#ffa500' : '#41cc41';

  const toggleSwitch = () => {
    setEnableGasStation((prev) => !prev);
  };

  const handleSpeedChange = (newSpeed: Speed) => {
    setSpeed(newSpeed);
    if (!enableGasStation) {
      const config = GAS_OPTIONS[newSpeed];
      setGasPrice(config.gasPrice.toString());
      setGasLimit(config.gasLimit.toString());
    }
  };

  return (
    <ModalCustom isOpen={isOpen} title={t('swap.gasSettings.title', 'Gas Settings')} onCloseModal={onClose}>
      <ModalContent>
        <Header>
          <GasStationLabel>{t('swap.gasSettings.gasStation', 'GAS STATION')}</GasStationLabel>
          <SwitchContainer>
            <SwitchInput type="checkbox" checked={enableGasStation} onChange={toggleSwitch} />
            <SwitchSlider />
          </SwitchContainer>
        </Header>

        {!enableGasStation ? (
          <>
            <InputWrapper>
              <BaseTextInput
                title={t('swap.gasSettings.gasLimitLabel', 'Gas Limit')}
                inputProps={{
                  type: 'number',
                  placeholder: t('swap.gasSettings.gasLimitPlaceholder', 'Enter gas limit'),
                  value: gasLimit,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGasLimit(e.target.value),
                }}
                height="auto"
              />
            </InputWrapper>
            <InputWrapper>
              <BaseTextInput
                title={t('swap.gasSettings.gasPriceLabel', 'Gas Price')}
                inputProps={{
                  type: 'number',
                  placeholder: t('swap.gasSettings.gasPricePlaceholder', 'Enter gas price'),
                  value: gasPrice,
                  step: '0.00000001',
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGasPrice(e.target.value),
                }}
                height="auto"
              />
            </InputWrapper>
            <RadioButtons<Speed> options={speedValues} value={speed} setValue={handleSpeedChange} />
            <InfoSection>
              <InfoTitle>{t('swap.gasSettings.failureCost', 'Failure Cost')}</InfoTitle>
              <InfoValue color={color}>{gasFee.toFixed(6)} KDA</InfoValue>
            </InfoSection>
          </>
        ) : (
          <NoGasCostText>{t('swap.gasSettings.noGasCost', 'No gas cost - subsidized by eckoDEX through Kadena gas stations.')}</NoGasCostText>
        )}
      </ModalContent>
    </ModalCustom>
  );
};

export default GasSettingModal;

