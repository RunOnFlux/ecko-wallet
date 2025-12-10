import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from 'src/stores/hooks';
import { getSelectedNetwork } from 'src/stores/slices/extensions';
import { fetchLocal } from 'src/utils/chainweb';

type PairReserve = {
  token0: string;
  token1: string;
};

type SwapContextValue = {
  pairReserve: PairReserve;
  ratio: number;
  slippage: number;
  ttl: number;
  enableGasStation: boolean;
  gasPrice: string;
  gasLimit: string;
  setSlippage: (value: number) => void;
  setTtl: (value: number) => void;
  setEnableGasStation: (value: boolean | ((prev: boolean) => boolean)) => void;
  setGasPrice: (value: string) => void;
  setGasLimit: (value: string) => void;
  getReserves: (token0Address: string, token1Address: string) => Promise<void>;
  computeOut: (amountIn: string) => number;
  computeIn: (amountOut: string) => number;
  computePriceImpact: (amountIn: string, amountOut: string) => number;
};

const FEE = 0.003;
const DEFAULT_CHAIN_ID = 2;

const SwapContext = createContext<SwapContextValue | undefined>(undefined);

export const SwapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const selectedNetwork = useAppSelector(getSelectedNetwork);

  const [pairReserve, setPairReserve] = useState<PairReserve>({ token0: '', token1: '' });
  const [slippage, setSlippage] = useState<number>(0.05);
  const [ttl, setTtl] = useState<number>(600);
  const [ratio, setRatio] = useState<number>(NaN);
  const [enableGasStation, setEnableGasStation] = useState<boolean>(true);
  const [gasPrice, setGasPrice] = useState<string>('0.000001');
  const [gasLimit, setGasLimit] = useState<string>('10000');

  useEffect(() => {
    if (pairReserve.token0 && pairReserve.token1) {
      const r0 = Number(pairReserve.token0);
      const r1 = Number(pairReserve.token1);
      setRatio(r0 && r1 ? r0 / r1 : NaN);
    } else {
      setRatio(NaN);
    }
  }, [pairReserve]);

  const getReserves = useCallback(
    async (token0Address: string, token1Address: string) => {
      try {
        const pactCode = `(use kaddex.exchange) (let* ((p (get-pair ${token0Address} ${token1Address})) (reserveA (reserve-for p ${token0Address})) (reserveB (reserve-for p ${token1Address}))) [reserveA reserveB])`;
        const res = await fetchLocal(pactCode, selectedNetwork.url, selectedNetwork.networkId, DEFAULT_CHAIN_ID);
        const data = res?.result?.data;
        if (Array.isArray(data) && data.length === 2) {
          const normalize = (v: any) =>
            typeof v === 'number' ? v : typeof v === 'string' ? v : v?.decimal ?? v?.int ?? 0;
          setPairReserve({
            token0: String(normalize(data[0])),
            token1: String(normalize(data[1])),
          });
        } else {
          setPairReserve({ token0: '', token1: '' });
        }
      } catch {
        setPairReserve({ token0: '', token1: '' });
      }
    },
    [selectedNetwork],
  );

  const computeOut = useCallback(
    (amountIn: string): number => {
      const amount = Number(amountIn);
      if (!amount || !pairReserve.token0 || !pairReserve.token1) return 0;
      const reserveOut = Number(pairReserve.token1);
      const reserveIn = Number(pairReserve.token0);
      const numerator = amount * (1 - FEE) * reserveOut;
      const denominator = reserveIn + amount * (1 - FEE);
      return numerator / denominator;
    },
    [pairReserve],
  );

  const computeIn = useCallback(
    (amountOut: string): number => {
      const amount = Number(amountOut);
      if (!amount || !pairReserve.token0 || !pairReserve.token1) return 0;
      const reserveOut = Number(pairReserve.token1);
      const reserveIn = Number(pairReserve.token0);
      const numerator = reserveIn * amount;
      const denominator = (reserveOut - amount) * (1 - FEE);
      return numerator / denominator;
    },
    [pairReserve],
  );

  const computePriceImpact = useCallback(
    (amountIn: string, amountOut: string): number => {
      if (!pairReserve.token0 || !pairReserve.token1) return 0;
      const reserveOut = Number(pairReserve.token1);
      const reserveIn = Number(pairReserve.token0);
      const midPrice = reserveOut / reserveIn;
      const exactQuote = Number(amountIn) * midPrice;
      if (!exactQuote) return 0;
      return (exactQuote - Number(amountOut)) / exactQuote;
    },
    [pairReserve],
  );

  const value: SwapContextValue = useMemo(
    () => ({
      pairReserve,
      ratio,
      slippage,
      ttl,
      enableGasStation,
      gasPrice,
      gasLimit,
      setSlippage,
      setTtl,
      setEnableGasStation,
      setGasPrice,
      setGasLimit,
      getReserves,
      computeOut,
      computeIn,
      computePriceImpact,
    }),
    [
      pairReserve,
      ratio,
      slippage,
      ttl,
      enableGasStation,
      gasPrice,
      gasLimit,
      getReserves,
      computeOut,
      computeIn,
      computePriceImpact,
    ],
  );

  return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
};

export const useSwapContext = (): SwapContextValue => {
  const ctx = useContext(SwapContext);
  if (!ctx) {
    throw new Error('useSwapContext must be used within a SwapProvider');
  }
  return ctx;
};

