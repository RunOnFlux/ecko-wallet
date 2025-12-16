import styled from 'styled-components';
import { getTokenImageUrl } from 'src/utils/constant';

const TokenSelectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text?.primary};
  min-width: 140px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.primary || '#ffa900'};
  }

  svg {
    width: 12px;
    height: 12px;
    fill: ${({ theme }) => theme.text?.primary};
  }
`;

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

interface TokenSelectorProps {
  tokenAddress: string;
  tokenSymbol: string;
  onClick: () => void;
}

const TokenSelector = ({ tokenAddress, tokenSymbol, onClick }: TokenSelectorProps) => {
  return (
    <TokenSelectButton onClick={onClick}>
      <TokenIcon src={getTokenImageUrl(tokenAddress)} alt={tokenSymbol} />
      <span>{tokenSymbol.toUpperCase()}</span>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </TokenSelectButton>
  );
};

export default TokenSelector;

