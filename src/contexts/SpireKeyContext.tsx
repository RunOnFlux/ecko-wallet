import React, { createContext, useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Overlay } from 'src/components/Modal/ModalCustom';
import { SecondaryLabel } from 'src/components';
import { SpinnerWrapper } from 'src/pages/SendTransactions/views/style';
import SpokesLoading from 'src/components/Loading/Spokes';
import { connect as spireConnect, sign as spireSign, initSpireKey } from '@kadena/spirekey-sdk';
import { createTransactionBuilder, ChainId, ICommand, IUnsignedCommand } from '@kadena/client';

const SpireKeyModal = styled.div`
  position: fixed;
  padding: 24px;
  top: 20%;
  left: auto;
  width: 80%;
  height: 150px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1000;
  background-color: ${({ theme }) => theme.modalBackground};
  border-radius: 25px;
  width: 80%;
  box-shadow: 0 0 4px 0px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease-out;
`;

export interface SpireKeyAccountLike {
  accountName: string;
  networkId: string;
  chainIds: string[];
  isReady: () => Promise<void>;
  devices?: Array<{
    guard: {
      keys: string[];
    };
  }>;
}

interface SpireKeyContextData {
  error: string;
  account?: SpireKeyAccountLike;
  isWaitingSpireKey: boolean;
  connectAccount: (networkId: string, chainId: string) => Promise<SpireKeyAccountLike | undefined>;
  isReady: () => Promise<void>;
  signTransactions: (transactions: any[], requirements?: any[]) => Promise<(IUnsignedCommand | ICommand)[] | undefined>;
  ensureAccountReady: (networkId: string, chainId: string) => Promise<SpireKeyAccountLike | undefined>;
  buildTransaction: (params: {
    senderName: string;
    receiverName: string;
    amount: number;
    chainId: string;
    networkId: string;
    fungibleToken: string;
    isCrossChain?: boolean;
    receiverChainId?: string;
  }) => any;
  disconnect: () => void;
}

export const SpireKeyContext = createContext<SpireKeyContextData>({
  error: '',
  account: undefined,
  isWaitingSpireKey: false,
  connectAccount: async () => undefined,
  isReady: async () => {},
  signTransactions: async () => undefined,
  ensureAccountReady: async () => undefined,
  buildTransaction: () => ({}),
  disconnect: () => {},
});

export const SpireKeyProvider = ({ children }: any) => {
  const [account, setAccount] = useState<SpireKeyAccountLike | undefined>();
  const [isWaitingSpireKey, setIsWaitingSpireKey] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>();
  const [error, setError] = useState<string>('');
  const [lastNetworkId, setLastNetworkId] = useState<string | undefined>();
  const [lastChainId, setLastChainId] = useState<string | undefined>();

  useEffect(() => {
    initSpireKey({
      hostUrl: 'https://chainweaver.kadena.io',
    });
  }, []);

  const waitForSpireKey = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      setIsWaitingSpireKey(true);
      const result = await fn();
      setIsWaitingSpireKey(false);
      return result;
    } catch (err: any) {
      setIsWaitingSpireKey(false);
      setError(err?.message ?? String(err));
      throw err;
    }
  };

  const connectAccount = async (networkId: string, chainId: string): Promise<SpireKeyAccountLike | undefined> => {
    try {
      setMessage('Please follow SpireKey instructions');
      const acc: any = await waitForSpireKey(() => spireConnect(networkId, chainId as unknown as any));
      setAccount(acc as SpireKeyAccountLike);
      setLastNetworkId(networkId);
      setLastChainId(chainId);
      await acc.isReady();
      return acc as SpireKeyAccountLike;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('SpireKey connect canceled or failed', err);
      return undefined;
    }
  };

  const isReady = async () => {
    if (account?.isReady) {
      await account.isReady();
    }
  };

  const ensureAccountReady = async (networkId: string, chainId: string): Promise<SpireKeyAccountLike | undefined> => {
    try {
      if (account?.isReady) {
        await account.isReady();
        return account;
      }
    } catch {
      // fall through to reconnect
    }
    const targetNetwork = networkId ?? lastNetworkId ?? '';
    const targetChain = chainId ?? lastChainId ?? '0';
    return connectAccount(targetNetwork, targetChain);
  };

  const buildTransaction = async (params: {
    senderName: string;
    receiverName: string;
    amount: number;
    chainId: string;
    networkId: string;
    fungibleToken: string;
    isCrossChain?: boolean;
    receiverChainId?: string;
  }) => {
    const { senderName, receiverName, amount, chainId, networkId, fungibleToken, isCrossChain, receiverChainId } = params;

    const ensureAccount = await ensureAccountReady(networkId, chainId);

    let tx = createTransactionBuilder()
      .execution(
        isCrossChain
          ? `(${fungibleToken}.transfer-crosschain "${senderName}" "${receiverName}" (read-keyset "ks") "${receiverChainId}" ${amount.toFixed(8)})`
          : `(${fungibleToken}.transfer "${senderName}" "${receiverName}" ${amount.toFixed(8)})`,
      )
      .setMeta({
        senderAccount: senderName,
        chainId: chainId as ChainId,
      })
      .setNetworkId(networkId);

    if (isCrossChain) {
      const recvPub = receiverName.startsWith('k:') ? receiverName.slice(2) : undefined;
      const ks = recvPub
        ? { keys: [recvPub], pred: 'keys-all' }
        : { keys: (ensureAccount?.devices?.[0]?.guard?.keys ?? []).slice(0, 1), pred: 'keys-any' };
      tx.addData('ks', ks);
    }

    if (ensureAccount?.devices) {
      ensureAccount.devices.flatMap((d: any) =>
        d.guard.keys.map((k: string) =>
          tx.addSigner(
            {
              pubKey: k,
              scheme: /^WEBAUTHN-/.test(k) ? 'WebAuthn' : 'ED25519',
            },
            (withCap) => [
              withCap(
                isCrossChain ? `${fungibleToken}.TRANSFER_XCHAIN` : `${fungibleToken}.TRANSFER`,
                senderName,
                receiverName,
                { decimal: amount.toFixed(8) },
                ...(isCrossChain ? [receiverChainId] : []),
              ),
              withCap(`coin.GAS`),
            ],
          ),
        ),
      );
    } else {
      tx.addSigner(
        {
          pubKey: senderName,
          scheme: 'ED25519',
        },
        (withCap) => [
          withCap(
            isCrossChain ? `${fungibleToken}.TRANSFER_XCHAIN` : `${fungibleToken}.TRANSFER`,
            senderName,
            receiverName,
            { decimal: amount.toFixed(8) },
            ...(isCrossChain ? [receiverChainId] : []),
          ),
          withCap(`coin.GAS`),
        ],
      );
    }

    return tx.createTransaction();
  };

  const signTransactions = async (transactions: any[], requirements?: any[]): Promise<(IUnsignedCommand | ICommand)[] | undefined> => {
    try {
      setMessage('Please confirm on SpireKey');
      const result = await waitForSpireKey(() => spireSign(transactions, requirements));
      const signed = result?.transactions;
      return signed;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('SpireKey sign canceled or failed', err);
      return undefined;
    }
  };

  const disconnect = () => {
    setAccount(undefined);
  };

  return (
    <SpireKeyContext.Provider
      value={{
        error,
        account,
        isWaitingSpireKey,
        connectAccount,
        isReady,
        signTransactions,
        ensureAccountReady,
        buildTransaction,
        disconnect,
      }}
    >
      {children}
      {isWaitingSpireKey && (
        <>
          <SpireKeyModal>
            <SecondaryLabel>
              Please follow SpireKey&apos;s instructions
              <br />
              {message ?? ''}
            </SecondaryLabel>
            <SpinnerWrapper>
              <SpokesLoading />
            </SpinnerWrapper>
          </SpireKeyModal>
          <Overlay zIndex={99} />
        </>
      )}
    </SpireKeyContext.Provider>
  );
};

export const SpireKeyConsumer = SpireKeyContext.Consumer;

export function useSpireKeyContext() {
  return useContext(SpireKeyContext);
}
