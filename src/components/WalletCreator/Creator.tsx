import { useEffect } from 'react';
import { useCreateFirstAccountAvailable } from 'src/hooks/wallet';
import { useAppSelector } from 'src/stores/hooks';
import { getWallets } from 'src/stores/slices/wallet';

const Creator = () => {
  const wallets = useAppSelector(getWallets);
  const createAccount = useCreateFirstAccountAvailable();

  useEffect(() => {
    const init = async () => {
      if (wallets.length > 0) {
        return;
      }

      try {
        await createAccount();
      } catch (error) {
        console.error('Error creating account:', error);
      }
    };

    init();
  }, [wallets, createAccount]);

  return null;
};

export default Creator;
