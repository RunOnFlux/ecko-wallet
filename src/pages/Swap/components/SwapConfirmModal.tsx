import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { DivFlex, SecondaryLabel, CommonLabel } from 'src/components';
import Button from 'src/components/Buttons';
import AlertIconSVG from 'src/images/icon-alert.svg?react';
import { Warning } from 'src/pages/SendTransactions/styles';
import { humanReadableNumber } from 'src/utils';
import { getTokenImageUrl } from 'src/utils/constant';
import { IFungibleToken } from 'src/pages/ImportToken';

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

interface SwapConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  fromToken: IFungibleToken;
  toToken: IFungibleToken;
  amountFrom: string;
  amountTo: string;
  estimateFromUSD: number | null;
  estimateToUSD: number | null;
  slippage: number;
  priceImpact: number;
  gasPrice: string;
  gasLimit: string;
  gasFee: number;
  gasFeeUSD: number;
}

const SwapConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  fromToken,
  toToken,
  amountFrom,
  amountTo,
  estimateFromUSD,
  estimateToUSD,
  slippage,
  priceImpact,
  gasPrice,
  gasLimit,
  gasFee,
  gasFeeUSD,
}: SwapConfirmModalProps) => {
  const { t } = useTranslation();

  return (
    <ModalCustom isOpen={isOpen} title={t('swap.confirmSwap', 'Confirm Swap')} onCloseModal={onClose}>
      <div style={{ padding: '0 20px 20px 20px', color: 'inherit' }}>
        <DivFlex margin="20px 0px" justifyContent="space-between" alignItems="center" flexDirection="column" gap="10px">
          <DivFlex justifyContent="center" alignItems="center" gap="8px">
            <TokenIcon src={getTokenImageUrl(fromToken.contractAddress)} alt={fromToken.symbol} />
            <CommonLabel fontSize={18} fontWeight={600}>
              {amountFrom} {fromToken.symbol.toUpperCase()}
            </CommonLabel>
          </DivFlex>
          <SecondaryLabel fontSize={24}>↓</SecondaryLabel>
          <DivFlex justifyContent="center" alignItems="center" gap="8px">
            <TokenIcon src={getTokenImageUrl(toToken.contractAddress)} alt={toToken.symbol} />
            <CommonLabel fontSize={18} fontWeight={600}>
              {amountTo} {toToken.symbol.toUpperCase()}
            </CommonLabel>
          </DivFlex>
        </DivFlex>

        <DivFlex margin="10px 0px" justifyContent="space-between" alignItems="center">
          <SecondaryLabel uppercase>{t('swap.from', 'From')}</SecondaryLabel>
          <DivFlex flexDirection="column" alignItems="flex-end">
            <SecondaryLabel>
              {amountFrom} {fromToken.symbol.toUpperCase()}
            </SecondaryLabel>
            {estimateFromUSD && (
              <CommonLabel fontSize={12} fontWeight={600}>
                {humanReadableNumber(estimateFromUSD)} USD
              </CommonLabel>
            )}
          </DivFlex>
        </DivFlex>

        <DivFlex margin="10px 0px" justifyContent="space-between" alignItems="center">
          <SecondaryLabel uppercase>{t('swap.to', 'To')}</SecondaryLabel>
          <DivFlex flexDirection="column" alignItems="flex-end">
            <SecondaryLabel>
              {amountTo} {toToken.symbol.toUpperCase()}
            </SecondaryLabel>
            {estimateToUSD && (
              <CommonLabel fontSize={12} fontWeight={600}>
                {humanReadableNumber(estimateToUSD)} USD
              </CommonLabel>
            )}
          </DivFlex>
        </DivFlex>

        <DivFlex margin="10px 0 0 0" justifyContent="space-between" alignItems="center">
          <SecondaryLabel uppercase>{t('swap.slippage', 'Slippage')}</SecondaryLabel>
          <SecondaryLabel>{(slippage * 100).toFixed(2)}%</SecondaryLabel>
        </DivFlex>

        <DivFlex margin="10px 0 0 0" justifyContent="space-between" alignItems="center">
          <SecondaryLabel uppercase>{t('swap.priceImpact', 'Price Impact')}</SecondaryLabel>
          <SecondaryLabel style={{ color: priceImpact > 0.05 ? '#ff0000' : 'inherit' }}>{(priceImpact * 100).toFixed(2)}%</SecondaryLabel>
        </DivFlex>

        <DivFlex margin="10px 0 0 0" justifyContent="space-between" alignItems="center">
          <SecondaryLabel uppercase>{t('popupConfirm.labelGasLimit')}</SecondaryLabel>
          <SecondaryLabel>{gasLimit}</SecondaryLabel>
        </DivFlex>

        <DivFlex margin="1px 0px" justifyContent="space-between" alignItems="center">
          <SecondaryLabel uppercase>{t('popupConfirm.labelGasPrice')}</SecondaryLabel>
          <SecondaryLabel>{gasPrice} KDA</SecondaryLabel>
        </DivFlex>

        <DivFlex justifyContent="space-between" alignItems="flex-start">
          <SecondaryLabel uppercase>{t('popupConfirm.labelGasFee')}</SecondaryLabel>
          <DivFlex flexDirection="column" alignItems="flex-end">
            <SecondaryLabel>{gasFee.toFixed(6)} KDA</SecondaryLabel>
            <CommonLabel fontSize={12} fontWeight={600}>
              {gasFeeUSD > 0 ? humanReadableNumber(gasFeeUSD) : '--'} USD
            </CommonLabel>
          </DivFlex>
        </DivFlex>

        {priceImpact > 0.05 && (
          <Warning margin="10px 0" style={{ justifyContent: 'center' }}>
            <AlertIconSVG />
            <div>
              <span>{t('swap.highPriceImpact', 'High price impact! Your trade may result in significant slippage.')}</span>
            </div>
          </Warning>
        )}

        <DivFlex margin="20px 0 0 0" gap="5px">
          <Button label={t('common.cancel')} size="full" variant="secondary" onClick={onClose} />
          <Button label={isSubmitting ? t('swap.swapping', 'Swapping...') : t('swap.swapBlock.confirm', 'Swap')} size="full" onClick={onConfirm} disabled={isSubmitting} />
        </DivFlex>
      </div>
    </ModalCustom>
  );
};

export default SwapConfirmModal;

