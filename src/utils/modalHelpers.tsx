import React from 'react';
import { CommonLabel, DivFlex } from 'src/components';
import Button from 'src/components/Buttons';

interface WarningModalConfig {
  title?: string;
  message: string;
  onCancel?: () => void;
  onContinue: () => void;
  cancelLabel?: string;
  continueLabel?: string;
}

export const createWarningModal = (config: WarningModalConfig) => {
  const { title = 'Warning', message, onCancel, onContinue, cancelLabel = 'Cancel', continueLabel = 'Continue' } = config;

  return {
    title,
    content: (
      <DivFlex flexDirection="column" alignItems="center" justifyContent="space-evenly" padding="15px" style={{ textAlign: 'center' }}>
        <CommonLabel fontWeight={600} fontSize={14}>
          {message}
        </CommonLabel>
        <DivFlex gap="10px" style={{ width: '90%', marginTop: 40 }}>
          {onCancel && <Button onClick={onCancel} variant="secondary" label={cancelLabel} size="full" />}
          <Button onClick={onContinue} label={continueLabel} size="full" />
        </DivFlex>
      </DivFlex>
    ),
  };
};

export const useWarningModal = (openModal: (config: any) => void, closeModal: () => void) => {
  const showWarningModal = (
    config: Omit<WarningModalConfig, 'onCancel' | 'onContinue'> & {
      onCancel?: () => void;
      onContinue?: () => void;
    },
  ) => {
    const modalConfig = createWarningModal({
      ...config,
      onCancel: config.onCancel || closeModal,
      onContinue: config.onContinue || closeModal,
    });

    openModal(modalConfig);
  };

  return { showWarningModal };
};
