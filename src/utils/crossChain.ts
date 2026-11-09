// Cross-chain transfers: step 0 burns the funds on the source chain, step 1
// (the continuation) credits them on the target chain. A relayer often sends
// step 1 before the wallet does. Chainweb then rejects the wallet's
// continuation at /send ("already-completed defpact"), or the continuation
// fails on chain ("resumePact: pact completed"). In both cases the funds have
// arrived and the transfer is finished.
export const isPactAlreadyCompleted = (text?: string | null): boolean =>
  !!text && (text.includes('already-completed defpact') || text.includes('resumePact: pact completed'));

export type ContinuationSendResult = { requestKey: string } | { alreadyCompleted: true } | { error: string };

export const readContinuationSendResult = async (response: Response): Promise<ContinuationSendResult> => {
  if (response.ok) {
    const body = await response.json();
    const requestKey = body?.requestKeys?.[0];
    return requestKey ? { requestKey } : { error: 'No request key returned' };
  }
  const text = await response.text();
  return isPactAlreadyCompleted(text) ? { alreadyCompleted: true } : { error: text };
};
