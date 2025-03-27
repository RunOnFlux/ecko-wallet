import { IFungibleToken } from 'src/pages/ImportToken';
import { shortenAddress } from 'src/utils';
import { LocalActivity } from './types';

export type TransactionsResponse = {
  amount: string;
  chainid: string;
  code: string;
  creationtime: string;
  direction: 'IN' | 'OUT';
  error: string | null;
  // eslint-disable-next-line camelcase
  from_acct: string;
  gas: string;
  gaslimit: string;
  gasprice: number;
  modulename: string;
  requestkey: string;
  status: 'SUCCESS' | 'ERROR';
  targetChainId: string | null;
  ticker: string;
  // eslint-disable-next-line camelcase
  to_acct: string;
  transactionType: 'TRANSFER' | 'SWAP';
}[];

export type Transaction = TransactionsResponse[number];

export const inferSymbolFromLocalActivity = (activity: LocalActivity, tokens: IFungibleToken[]) => {
  const inferredSymbol =
    // First, try to retrieve from local tokens (user added tokens)
    tokens.find((t) => t.contractAddress === activity.module)?.symbol ||
    // Then try to user ticker from DEX, then symbol previously stored i local activity, else use module address
    activity.ticker ||
    activity.symbol ||
    activity.module;

  const inferredToken = inferredSymbol === activity.module ? shortenAddress(activity.module) : inferredSymbol;
  return inferredToken;
};

export const generateActivityWithId = (activity: Omit<LocalActivity, 'id'>): LocalActivity => ({
  ...activity,
  id: generateActivityId(activity),
});

export const generateActivityId = (activity: Omit<LocalActivity, 'id'>): string =>
  `${activity.requestKey}${activity.direction}${activity.sender}${activity.receiver}${activity.module}`;

export const transactionToActivity = (transaction: Transaction, tokens: IFungibleToken[]) => {
  const supportedTransactions = ['TRANSFER', 'SWAP'];
  if (!supportedTransactions.includes(transaction.transactionType)) {
    return undefined;
  }

  const date = new Date(transaction.creationtime);
  const inferredToken = tokens.find((t) => t.contractAddress === transaction.modulename);
  const receiver = transaction.transactionType === 'SWAP' ? 'Swap' : transaction.to_acct;

  const activity: LocalActivity = generateActivityWithId({
    amount: transaction.amount,
    createdTime: date.toString(),
    direction: transaction.direction,
    gas: Number(transaction.gas),
    gasPrice: transaction.gasprice,
    receiver,
    receiverChainId: transaction.targetChainId || transaction.chainid,
    requestKey: transaction.requestkey,
    sender: transaction.from_acct,
    senderChainId: transaction.chainid,
    status: transaction.status.toLowerCase() as 'success' | 'error',
    symbol: inferredToken?.symbol || transaction.modulename,
    module: transaction.modulename,
    ticker: transaction.ticker,
    transactionType: transaction.transactionType,

    result: {
      status: transaction.status.toLowerCase(),
    },

    metaData: {
      blockTime: date.getTime() * 1000,
    },
  });

  return activity;
};
