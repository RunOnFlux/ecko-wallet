import React from 'react';
import { CommonLabel, DivFlex } from '..';
import Button from '../Buttons';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  text: React.ReactNode;
  onClose: any;
  onConfirm: any;
}

export const ConfirmModal = ({ text, onClose, onConfirm }: ConfirmModalProps) => {
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ padding: '30px 0' }}>
        <CommonLabel fontSize={14}>{text}</CommonLabel>
      </div>
      <DivFlex padding="20px" justifyContent="space-between" gap="5px">
        <Button onClick={onClose} label={t('common.cancel')} size="full" variant="secondary" />
        <Button onClick={onConfirm} label={t('common.confirm')} size="full" />
      </DivFlex>
    </div>
  );
};
