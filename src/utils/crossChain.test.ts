import { isPactAlreadyCompleted, readContinuationSendResult } from './crossChain';

const response = (ok: boolean, body: string) =>
  ({
    ok,
    json: async () => JSON.parse(body),
    text: async () => body,
  } as unknown as Response);

describe('isPactAlreadyCompleted', () => {
  it('matches the /send rejection Chainweb returns when a relayer finished the pact first', () => {
    expect(
      isPactAlreadyCompleted(
        'Validation failed for hash "abc": Attempt to continue an already-completed defpact: "PvSgJYm1Rz8zNnUnMQs9yXL7GIvxtcbz8a9LG3-twNs"',
      ),
    ).toBe(true);
  });

  it('matches the on-chain error of a continuation that ran after the pact completed', () => {
    expect(isPactAlreadyCompleted('resumePact: pact completed: PvSgJYm1Rz8zNnUnMQs9yXL7GIvxtcbz8a9LG3-twNs')).toBe(true);
  });

  it('does not match other errors', () => {
    expect(isPactAlreadyCompleted('Validation failed: insufficient gas')).toBe(false);
    expect(isPactAlreadyCompleted('')).toBe(false);
    expect(isPactAlreadyCompleted(undefined)).toBe(false);
  });
});

describe('readContinuationSendResult', () => {
  it('returns the request key of an accepted continuation', async () => {
    await expect(readContinuationSendResult(response(true, '{"requestKeys":["key-1"]}'))).resolves.toEqual({
      requestKey: 'key-1',
    });
  });

  it('reports an already-completed pact instead of a failure', async () => {
    const body = 'Validation failed for hash "abc": Attempt to continue an already-completed defpact: "pact-1"';
    await expect(readContinuationSendResult(response(false, body))).resolves.toEqual({ alreadyCompleted: true });
  });

  it('returns the error text of any other rejection', async () => {
    await expect(readContinuationSendResult(response(false, 'Validation failed: insufficient gas'))).resolves.toEqual({
      error: 'Validation failed: insufficient gas',
    });
  });

  it('treats an accepted response without request keys as an error', async () => {
    await expect(readContinuationSendResult(response(true, '{}'))).resolves.toEqual({ error: 'No request key returned' });
  });
});
