import styled from 'styled-components';
import { SecondaryLabel } from 'src/components';

const RadioContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-width: 250px;
`;

const RadioButton = styled.button<{ active: boolean }>`
  border-radius: 30px;
  border: 2px solid ${({ theme, active }) => (active ? theme.brand || '#ed1cb5' : theme.border || '#e0e0e0')};
  background: ${({ theme, active }) => (active ? theme.brand || '#ed1cb5' : theme.background)};
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.brand || '#ed1cb5'};
  }
`;

const RadioText = styled(SecondaryLabel)<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.text?.primary : theme.text?.secondary)};
  font-weight: bold;
  text-transform: uppercase;
`;

export interface RadioButtonsProps<T extends string> {
  options: T[];
  value: T;
  setValue: (value: T) => void;
  prefix?: string;
}

const RadioButtons = <T extends string>({ options, value, setValue, prefix }: RadioButtonsProps<T>) => {
  const handleClick = (option: T) => () => {
    setValue(option);
  };

  return (
    <RadioContainer>
      {options.map((option) => {
        const isActive = value === option;
        return (
          <RadioButton key={option} active={isActive} onClick={handleClick(option)} type="button">
            <RadioText active={isActive}>
              {option}
              {prefix}
            </RadioText>
          </RadioButton>
        );
      })}
    </RadioContainer>
  );
};

export default RadioButtons;

