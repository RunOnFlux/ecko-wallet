import React from 'react';
import { useHistory } from 'react-router-dom';
import { useModalContext } from 'src/contexts/ModalContext';
import { IconButton } from 'src/components/IconButton';
import ArrowSendIcon from 'src/images/arrow-send.svg?react';
import { DivFlex, CommonLabel } from 'src/components';
import { humanReadableNumber } from 'src/utils';
import { TokenElementProps } from './TokenElement';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';

export const TokenChainBalance = ({ name, contractAddress, balance, usdBalance, chainId, isNonTransferable }: TokenElementProps) => {
  const history = useHistory();
  const { closeModal } = useModalContext();
  const stateWallet = useCurrentWallet();

  const onSendToken = () => {
    const targetPath = `/transfer?coin=${contractAddress}&chainId=${chainId}`;
    closeModal();
    const isPopupView = typeof window !== 'undefined' && window.innerWidth <= 420;
    if (stateWallet?.account?.startsWith('r:') && isPopupView) {
      window.open(`/index.html#${targetPath}`, '_blank');
    } else {
      history.push(targetPath);
    }
  };
  return (
    <DivFlex
      justifyContent="space-between"
      style={{ padding: '10px 0', cursor: !isNonTransferable && 'pointer' }}
      onClick={!isNonTransferable && onSendToken}
    >
      <DivFlex flexDirection="column" justifyContent="center">
        <CommonLabel fontSize="14px" fontWeight={700}>
          {humanReadableNumber(balance, 5)} {name.toUpperCase()}
        </CommonLabel>
        <CommonLabel fontSize="14px">$ {humanReadableNumber(usdBalance, 2)}</CommonLabel>
      </DivFlex>
      <DivFlex justifyContent="flex-end" alignItems="center">
        <CommonLabel fontSize="14px" fontWeight={700}>
          CHAIN {chainId}
        </CommonLabel>
        {!isNonTransferable && (
          <IconButton
            className="path-fill-white"
            onClick={onSendToken}
            svgComponent={<ArrowSendIcon />}
            style={{ backgroundColor: '#20264E', marginLeft: 5, cursor: 'pointer' }}
          />
        )}
      </DivFlex>
    </DivFlex>
  );
};
