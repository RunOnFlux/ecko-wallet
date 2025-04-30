import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownRadioModal } from 'src/components/DropdownRadioModal';
import { SelectionOption } from 'src/components/RadioSelection';
import { StatusValue, statuses as rawStatuses } from './types';

export interface StatusFilterProps {
  status: StatusValue;
  onChangeStatus: (status: StatusValue) => void;
}

const StatusFilter = ({ status, onChangeStatus }: StatusFilterProps) => {
  const { t } = useTranslation();

  const statuses: SelectionOption[] = useMemo(
    () =>
      rawStatuses.map((s) => ({
        key: s.key,
        value: s.value,
        label: t(`statusFilter.options.${s.key}`),
      })),
    [t],
  );

  const selected = statuses.find((s) => s.value === status) || statuses[0];
  const displayValue = `${t('statusFilter.prefix')}${selected.label}`;

  const handleChange = (option: SelectionOption) => {
    onChangeStatus(option.value as StatusValue);
  };

  return (
    <DropdownRadioModal
      modalTitle={t('statusFilter.modalTitle')}
      value={selected}
      displayValue={displayValue}
      options={statuses}
      onChange={handleChange}
    />
  );
};

export default StatusFilter;
