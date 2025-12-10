import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { SecondaryLabel } from 'src/components';
import { useSwapContext } from 'src/contexts/SwapContext';
import RadioButtons from './RadioButtons';

const ModalContent = styled.div`
  padding: 25px;
  color: ${({ theme }) => theme.text?.primary};
  box-sizing: border-box;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
`;

const Title = styled(SecondaryLabel)`
  font-weight: 700;
  font-size: 12px;
  color: ${({ theme }) => theme.text?.primary};
  text-transform: uppercase;
  margin-top: 25px;
  margin-bottom: 12px;
  display: block;

  &:first-child {
    margin-top: 0;
  }
`;

const SlippageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
`;

const RadioButtonsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 200px;
`;

const Input = styled.input`
  border-radius: 30px;
  border: 2px solid ${({ theme }) => theme.border || '#e0e0e0'};
  background: ${({ theme }) => theme.background};
  padding: 10px 20px;
  padding-right: 30px;
  font-weight: bold;
  text-align: center;
  color: ${({ theme }) => theme.text?.primary};
  width: 100%;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.brand || '#ed1cb5'};
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

const Percent = styled.span`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.text?.primary};
  font-weight: bold;
  pointer-events: none;
`;

const DeadlineWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DeadlineText = styled(SecondaryLabel)`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.text?.primary};
`;

const slippageTolerances: string[] = ['0.1', '0.5', '1'];

interface TransactionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransactionSettingsModal = ({ isOpen, onClose }: TransactionSettingsModalProps) => {
  const { t } = useTranslation();
  const { slippage, setSlippage, ttl, setTtl } = useSwapContext();
  const [slippageInput, setSlippageInput] = useState<string>((slippage * 100).toFixed(1));

  useEffect(() => {
    setSlippageInput((slippage * 100).toFixed(1));
  }, [slippage]);

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(',', '.');
    
    if (value === '' || value === '.') {
      setSlippageInput(value);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return;
    }

    if (numValue > 100) {
      setSlippageInput('100.0');
      setSlippage(1);
      return;
    }

    if (numValue < 0) {
      setSlippageInput('0.0');
      setSlippage(0);
      return;
    }

    setSlippageInput(value);
    setSlippage(numValue / 100);
  };

  const handleSlippageBlur = () => {
    const numValue = parseFloat(slippageInput);
    if (isNaN(numValue) || numValue < 0) {
      setSlippageInput('0.0');
      setSlippage(0);
    } else if (numValue > 100) {
      setSlippageInput('100.0');
      setSlippage(1);
    } else {
      setSlippageInput(numValue.toFixed(1));
      setSlippage(numValue / 100);
    }
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      setTtl(600);
      return;
    }
    const numValue = parseInt(value, 10);
    if (numValue > 0 && numValue <= 60) {
      setTtl(numValue * 60);
    }
  };

  const setSlippageTolerance = (val: string) => {
    const numValue = parseFloat(val);
    setSlippage(numValue / 100);
    setSlippageInput(val);
  };

  return (
    <ModalCustom isOpen={isOpen} title={t('swap.transactionSettings.title', 'Transaction Settings')} onCloseModal={onClose}>
      <ModalContent>
        <Title>{t('swap.transactionSettings.slippageTitle', 'SLIPPAGE TOLERANCE')}</Title>
        <SlippageContainer>
          <RadioButtonsWrapper>
            <RadioButtons<string> prefix="%" options={slippageTolerances} value={(slippage * 100).toString()} setValue={setSlippageTolerance} />
          </RadioButtonsWrapper>
          <InputWrapper>
            <Input
              type="text"
              onChange={handleSlippageChange}
              onBlur={handleSlippageBlur}
              value={slippageInput}
              placeholder="0.0"
            />
            <Percent>%</Percent>
          </InputWrapper>
        </SlippageContainer>
        <Title>{t('swap.transactionSettings.deadlineTitle', 'TRANSACTION DEADLINE')}</Title>
        <DeadlineWrapper>
          <Input
            type="number"
            onChange={(e) => handleDeadlineChange(e.target.value)}
            value={(ttl / 60).toString()}
            min="1"
            max="60"
          />
          <DeadlineText>{t('swap.transactionSettings.minutes', 'minutes')}</DeadlineText>
        </DeadlineWrapper>
      </ModalContent>
    </ModalCustom>
  );
};

export default TransactionSettingsModal;

