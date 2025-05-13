import React from 'react';
import { FieldValues, UseFormClearErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import styled from 'styled-components';
import { useAccountBalanceContext } from 'src/contexts/AccountBalanceContext';
import { BigNumberConverter, humanReadableNumber, toFixedDown } from 'src/utils';
import { CommonLabel, DivFlex, PrimaryLabel, SecondaryLabel } from 'src/components';
import Button from 'src/components/Buttons';
import { SInput } from 'src/baseComponent/BaseTextInput';
import { IFungibleToken } from 'src/pages/ImportToken';
import { GasType, NUMBER_DECIMAL_AFTER_DOT } from 'src/utils/config';
import { useTranslation } from 'react-i18next';

export const AmountWrapper = styled(DivFlex)`
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type='number'] {
    -moz-appearance: textfield;
  }
`;

export const ErrorWrapper = styled.div`
  margin-top: 10px;
`;

export const Error = styled.span`
  color: ${(props) => props.theme.error.color};
  line-height: normal;
`;

export const AmountInput = styled(SInput)`
  flex: 1;
  fontsize: 45px;
  fontweight: 500;
  background: ${({ theme }) => theme.background};
`;

export type TFieldValues = FieldValues & {
  amount: string;
};

type CryptoAmountSelectorProps = {
  fungibleToken: IFungibleToken;
  showPrefilledButtons?: boolean;
  showEstimatedUSD?: boolean;
  selectedGas?: GasType;
  tokenBalance: number;
  register: UseFormRegister<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  clearErrors: UseFormClearErrors<TFieldValues>;
  errors: { [x: string]: any };
  readOnly: boolean;
  amount?: string;
  onChangeAmount?: (amount: string) => void;
};

const CryptoAmountSelector = ({
  fungibleToken,
  showPrefilledButtons = true,
  showEstimatedUSD = true,
  selectedGas,
  tokenBalance,
  register,
  setValue,
  clearErrors,
  errors,
  readOnly,
  onChangeAmount,
  ...props
}: CryptoAmountSelectorProps) => {
  const { t } = useTranslation();
  const { usdPrices } = useAccountBalanceContext();

  const [amount, setAmount] = React.useState(props.amount || '0.0');

  const estimateUSDAmount = Object.prototype.hasOwnProperty.call(usdPrices, fungibleToken.contractAddress)
    ? (usdPrices[fungibleToken.contractAddress as any] || 0) * Number(amount)
    : null;

  const gasFee = selectedGas ? BigNumberConverter(Number(selectedGas.GAS_PRICE) * Number(selectedGas.GAS_LIMIT)) : 0;

  const changeAmount = (e) => {
    const { value } = e.target;
    clearErrors('amount');
    let number: string = value
      .toString()
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*?)\..*/g, '$1');
    if (number.includes('.')) {
      const numString = number.toString().split('.');
      if (numString[1].length > NUMBER_DECIMAL_AFTER_DOT) {
        number = number.substring(0, number.length - 1);
      }
    }
    setAmount(number);
    setValue('amount', number);
    onChangeAmount?.(number);
  };

  const setPrefilledBalance = (type: 'max' | 'half') => {
    let amountValue = BigNumberConverter(tokenBalance);

    if (type === 'half') {
      amountValue /= 2;
    }

    if (fungibleToken.contractAddress === 'coin') {
      amountValue -= gasFee;
    }
    const amountCustom = amountValue > 0 ? toFixedDown(amountValue, 12) : '0';
    setAmount(amountCustom);
    setValue('amount', amountCustom);
    onChangeAmount?.(amountCustom);
  };

  const getInputFontSize = (length: number) => {
    if (length < 5) return 40;
    if (length < 12) return 40 - amount.toString().length;
    return 22;
  };

  return (
    <div>
      <DivFlex justifyContent="space-between" margin="10px 0" alignItems="center">
        <SecondaryLabel uppercase fontWeight={700} style={{ flex: 1 }}>
          {t('cryptoAmountSelector.labelAmountToSend')}
        </SecondaryLabel>
        {showPrefilledButtons && (
          <DivFlex justifyContent="flex-end" style={{ flex: 1, gap: 5 }}>
            <Button
              type="button"
              onClick={() => setPrefilledBalance('half')}
              label={t('cryptoAmountSelector.button.half')}
              size="full"
              variant="grey"
              style={{ height: 28, fontSize: 10, maxWidth: 60 }}
            />
            <Button
              type="button"
              onClick={() => setPrefilledBalance('max')}
              label={t('cryptoAmountSelector.button.max')}
              size="full"
              variant="grey"
              style={{ height: 28, fontSize: 10, maxWidth: 60 }}
            />
          </DivFlex>
        )}
      </DivFlex>

      <AmountWrapper alignItems="center" justifyContent="space-between">
        <AmountInput
          autoComplete="off"
          readOnly={readOnly}
          style={{
            fontSize: getInputFontSize(amount.toString().length || 40),
            padding: readOnly ? '0px 5px 0px 13px;' : '0px 5px 0px 0px',
          }}
          type="number"
          value={amount}
          height="auto"
          onWheel={(event) => event.currentTarget.blur()}
          {...register('amount', {
            required: {
              value: true,
              message: t('common.requiredField'),
            },
            validate: {
              isZero: (v) => Number(v) !== 0 || t('cryptoAmountSelector.error.invalidAmount'),
              positive: (v) => {
                const value = Number(v);
                let balance = BigNumberConverter(tokenBalance);
                if (fungibleToken.contractAddress === 'coin') {
                  balance -= gasFee;
                }
                return (value > 0 && value <= balance) || t('cryptoAmountSelector.error.insufficientFunds');
              },
            },
          })}
          onFocus={(event) => event.target.select()}
          onChange={changeAmount}
        />
        <PrimaryLabel fontSize={40} uppercase>
          {fungibleToken.symbol.substring(0, 5)}
        </PrimaryLabel>
      </AmountWrapper>

      {errors.amount && errors.amount.type === 'required' && (
        <ErrorWrapper>
          <DivFlex>
            <Error>{errors.amount.message}</Error>
          </DivFlex>
        </ErrorWrapper>
      )}
      {errors.amount && errors.amount.type === 'positive' && (
        <ErrorWrapper>
          <DivFlex>
            <Error>{errors.amount.message}</Error>
          </DivFlex>
        </ErrorWrapper>
      )}
      {errors.amount && errors.amount.type === 'isZero' && (
        <ErrorWrapper>
          <DivFlex>
            <Error>{errors.amount.message}</Error>
          </DivFlex>
        </ErrorWrapper>
      )}

      <DivFlex justifyContent="space-between" alignItems="center" margin="0px">
        {showEstimatedUSD && (
          <CommonLabel fontSize={12} fontWeight={600}>
            {estimateUSDAmount &&
              t('common.usd', {
                value: humanReadableNumber(estimateUSDAmount),
              })}
          </CommonLabel>
        )}
        <SecondaryLabel fontSize={12} fontWeight={600}>
          {t('cryptoAmountSelector.balance', {
            balance: BigNumberConverter(tokenBalance),
            symbol: fungibleToken.symbol.toUpperCase(),
          })}
        </SecondaryLabel>
      </DivFlex>
    </div>
  );
};

export default CryptoAmountSelector;
