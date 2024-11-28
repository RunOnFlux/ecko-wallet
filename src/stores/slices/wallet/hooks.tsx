import { createSelector } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Wallet } from '.';
import { RootState } from 'src/stores';

export const useCurrentWallet = (): Wallet => {
  const selector = useMemo(
    () =>
      createSelector(
        (state: RootState) => state.wallet,
        (value) => value,
      ),
    [],
  );

  return useSelector((state: RootState) => selector(state));
};
