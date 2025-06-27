/* eslint-disable react/no-unused-prop-types */
import { DivFlex, CommonLabel } from 'src/components';
import Spinner from 'src/components/Spinner';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { humanReadableNumber } from 'src/utils';
import { ECKO_DEXTOOLS_API_URL } from '@Utils/constant';

export const TokenElement = ({ contractAddress, name, balance, isLoadingBalances, usdBalance, rightText, onClick }: TokenElementProps) => {
  const { theme } = useAppThemeContext();

  const iconUrl = contractAddress
    ? `${ECKO_DEXTOOLS_API_URL}api/token-icon?token=${encodeURIComponent(contractAddress)}`
    : `${ECKO_DEXTOOLS_API_URL}public/token-icons/default.svg`;

  const renderRightText = () => {
    if (usdBalance !== undefined) {
      return `${humanReadableNumber(usdBalance, 2)} USD`;
    }
    if (rightText) {
      return rightText;
    }
    return '';
  };

  return (
    <DivFlex className="token-element" justifyContent="space-between" style={{ padding: '10px 0', cursor: 'pointer' }} onClick={onClick}>
      <DivFlex>
        <img
          crossOrigin="anonymous"
          style={{ width: 41, height: 41, marginRight: 12 }}
          src={iconUrl}
          alt={name}
          onError={(e) => {
            const fallbackUrl = `${ECKO_DEXTOOLS_API_URL}public/token-icons/default.svg`;
            if (e.currentTarget.src !== fallbackUrl) {
              e.currentTarget.src = fallbackUrl;
            }
          }}
        />
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
  isLoadingBalances?: boolean;
  isNonTransferable?: boolean;
  chainId?: number;
  onClick?: any;
}
