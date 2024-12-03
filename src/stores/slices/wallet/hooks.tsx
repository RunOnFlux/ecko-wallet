import { createSelector } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Wallet } from '.';
import { RootState } from 'src/stores';

export const useCurrentWallet = (): Wallet => {
  return useSelector((state: RootState) => state.wallet);
};
