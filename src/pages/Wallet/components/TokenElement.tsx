/* eslint-disable react/no-unused-prop-types */
import { DivFlex, CommonLabel } from 'src/components';
import Spinner from 'src/components/Spinner';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { humanReadableNumber } from 'src/utils';

export const TokenElement = ({ logo, name, balance, isLoadingBalances, usdBalance, rightText, onClick }: TokenElementProps) => {
  const renderRightText = () => {
    if (usdBalance !== undefined) {
      return `${humanReadableNumber(usdBalance, 2)} USD`;
    }
    if (rightText) {
      return rightText;
    }
    return '';
  };
  const { theme } = useAppThemeContext();
  return (
    <DivFlex className="token-element" justifyContent="space-between" style={{ padding: '10px 0', cursor: 'pointer' }} onClick={onClick}>
      <DivFlex>
        <img style={{ width: 41, height: 41, marginRight: 12 }} src={logo} alt={name} />
        <CommonLabel fontSize="14px" fontWeight={700} lineHeight="40px">
          {balance ? humanReadableNumber(balance, 5) : ''} {name}
        </CommonLabel>
      </DivFlex>
      <CommonLabel fontWeight={500} fontSize="12px" color={theme?.text?.secondary} lineHeight="40px">
        {isLoadingBalances ? <Spinner size={10} color={theme?.text?.secondary} weight={2} /> : renderRightText()}
      </CommonLabel>
    </DivFlex>
  );
};

export interface TokenElementProps {
  name: string;
  contractAddress?: string;
  balance?: number;
  usdBalance?: number;
  rightText?: string;
  logo?: any;
  isLoadingBalances?: boolean;
  isNonTransferable?: boolean;
  chainId?: number;
  onClick?: any;
}
