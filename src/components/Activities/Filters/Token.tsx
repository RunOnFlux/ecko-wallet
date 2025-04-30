import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownRadioModal } from 'src/components/DropdownRadioModal';
import { SelectionOption } from 'src/components/RadioSelection';
import { useFungibleTokensList } from 'src/hooks/fungibleTokens';

export interface TokenFilterProps {
  token?: string;
  onChangeToken: (token: string | undefined) => void;
}

const TokenFilter = ({ token, onChangeToken }: TokenFilterProps) => {
  const { t } = useTranslation();
  const tokens = useFungibleTokensList();

  const modalTokens: SelectionOption[] = useMemo(() => {
    const convertedTokens = tokens.map((tkn) => ({
      label: tkn.symbol,
      value: tkn.contractAddress,
    }));

    return [
      {
        label: t('tokenFilter.options.all'),
        value: undefined,
      },
      ...convertedTokens,
    ];
  }, [tokens, t]);

  const selectedToken = modalTokens.find((opt) => opt.value === token) || modalTokens[0];
  const displayValue = `${t('tokenFilter.prefix')}${selectedToken.label}`;

  const handleChangeToken = (option?: SelectionOption) => {
    onChangeToken(option?.value);
  };

  return (
    <DropdownRadioModal
      modalTitle={t('tokenFilter.modalTitle')}
      value={selectedToken}
      displayValue={displayValue}
      options={modalTokens}
      onChange={handleChangeToken}
      showFilter
    />
  );
};

export default TokenFilter;
