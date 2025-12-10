import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { IFungibleToken } from 'src/pages/ImportToken';
import { getTokenImageUrl } from 'src/utils/constant';

const TokenModalContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const TokenItem = styled.div<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ isSelected, theme }) => 
    isSelected 
      ? (theme.isDark ? 'rgba(237, 28, 181, 0.15)' : 'rgba(237, 28, 181, 0.1)')
      : 'transparent'
  };

  &:hover {
    background: ${({ theme }) => 
      theme.isDark 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.03)'
    };
  }
`;

const TokenItemText = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const TokenSymbol = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.text?.primary};
  text-transform: uppercase;
`;

const TokenAddress = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.text?.secondary};
`;

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: IFungibleToken[];
  selectedAddress: string;
  onSelectToken: (address: string) => void;
}

const TokenSelectionModal = ({ isOpen, onClose, tokens, selectedAddress, onSelectToken }: TokenSelectionModalProps) => {
  const { t } = useTranslation();

  const handleSelect = (address: string) => {
    onSelectToken(address);
    onClose();
  };

  return (
    <ModalCustom isOpen={isOpen} title={t('swap.selectToken', 'Select Token')} onCloseModal={onClose}>
      <TokenModalContent>
        {tokens.map((token) => (
          <TokenItem key={token.contractAddress} isSelected={token.contractAddress === selectedAddress} onClick={() => handleSelect(token.contractAddress)}>
            <TokenIcon src={getTokenImageUrl(token.contractAddress)} alt={token.symbol} />
            <TokenItemText>
              <TokenSymbol>{token.symbol}</TokenSymbol>
              <TokenAddress>{token.contractAddress}</TokenAddress>
            </TokenItemText>
          </TokenItem>
        ))}
      </TokenModalContent>
    </ModalCustom>
  );
};

export default TokenSelectionModal;

