import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getLocalDapps, getLocalWallets, setBringCashbackAddress, getLocalPassword } from 'src/utils/storage';
import { decryptKey } from 'src/utils/security';
import { useAppSelector } from 'src/stores/hooks';
import Button from 'src/components/Buttons';
import { Radio } from 'src/components/Radio';
import { DivFlex } from 'src/components';
import { shortenAddress } from 'src/utils';
import images from 'src/images';

const Wrapper = styled.div`
  padding: 0 20px;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 24px;
  line-height: 25px;
  color: ${({ theme }) => theme.text.primary};
  text-align: left;
  margin-bottom: 30px;
  margin-top: 20px;
`;

const Body = styled.div`
  height: auto;
  width: 100%;
`;

const Footer = styled.div`
  width: 100%;
  margin-top: 30px;
  margin-bottom: 30px;
`;

const DivImage = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 20px;
`;

const Image = styled.img`
  height: 80px;
  width: 80px;
  margin: auto;
`;

const BringAccountSelect = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const { selectedNetwork } = useAppSelector((state) => state.extensions);

  useEffect(() => {
    const loadWallets = () => {
      if (!selectedNetwork?.networkId) return;

      getLocalPassword(
        (password) => {
          getLocalWallets(
            selectedNetwork.networkId,
            (walletsList) => {
              const decryptedWallets = walletsList.map((w: any) => ({
                ...w,
                account: decryptKey(w.account, password),
                publicKey: decryptKey(w.publicKey, password),
              }));

              const uniqueWallets = decryptedWallets.filter(
                (value: any, index: number, self: any[]) =>
                  index === self.findIndex((t) => t.account === value.account)
              );

              setWallets(uniqueWallets);
              if (uniqueWallets.length > 0 && !selectedAccount) {
                setSelectedAccount(uniqueWallets[0].account);
              }
            },
            () => {}
          );
        },
        () => {}
      );
    };

    loadWallets();
  }, [selectedNetwork]);

  const handleConfirm = async () => {
    if (!selectedAccount) return;

    await setBringCashbackAddress(selectedAccount);

    getLocalDapps(
      (dapps) => {
        if (dapps?.tabId) {
          chrome.runtime.sendMessage(
            {
              target: 'kda.background',
              action: 'bring_resolveSelection',
              tabId: dapps.tabId,
              walletAddress: selectedAccount,
            },
            () => {
              setTimeout(() => {
                window.close();
              }, 300);
            }
          );
        } else {
          window.close();
        }
      },
      () => {
        window.close();
      }
    );
  };

  return (
    <Wrapper>
      <DivImage>
        <Image src={images.eckoWalletIcon} alt="logo" />
      </DivImage>
      <Title>Select Account for Bring Cashback</Title>
      <Body>
        <DivFlex flexDirection="column" padding="10px 0">
          {wallets.map((w) => (
            <Radio
              key={w.account}
              isChecked={selectedAccount === w.account}
              label={shortenAddress(w.account)}
              onClick={() => setSelectedAccount(w.account)}
              style={{ margin: '10px 0' }}
            />
          ))}
        </DivFlex>
      </Body>
      <Footer>
        <Button
          label="Confirm"
          size="full"
          variant="primary"
          onClick={handleConfirm}
          disabled={!selectedAccount}
        />
      </Footer>
    </Wrapper>
  );
};

export default BringAccountSelect;

