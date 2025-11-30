import { useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { require2FA } from 'src/stores/slices/auth';
import { useAppDispatch, useAppSelector } from 'src/stores/hooks';
import { BaseTextInput, InputError } from 'src/baseComponent';
import { useHistory } from 'react-router-dom';
import images from 'src/images';
import { checkIsValidOldPassword, decryptKey } from 'src/utils/security';
import { updateAccountMessage, updateCheckStatusMessage } from 'src/utils/message';
import { hash } from '@kadena/cryptography-utils';
import {
  getLocalDapps,
  getLocalSeedPhrase,
  getLocalWallets,
  getOldLocalPassword,
  initDataFromLocal,
  initLocalWallet,
  removeOldLocalPassword,
  setBringCashbackAddress,
  setLocalPassword,
} from 'src/utils/storage';
import Button from 'src/components/Buttons';
import { useSettingsContext } from 'src/contexts/SettingsContext';
import { isValidPassword } from '.';

const CreatePasswordWrapper = styled.div`
  padding: 0 20px;
`;
const Wrapper = styled.form`
  display: block;
`;
const Body = styled.div`
  height: auto;
  width: 100%;
  font-size: 16px;
  margin-top: 40px;
`;
const DivBody = styled.div`
  width: 100%;
  text-align: left;
  font-size: 16px;
  line-height: 40px;
  display: flex;
  align-items: center;
`;
const Title = styled.div`
  font-weight: 700;
  font-size: 24px;
  line-height: 25px;
  color: ${({ theme }) => theme.text.primary};
  text-align: left;
  margin-bottom: 50px;
`;
const Footer = styled.div`
  width: 100%;
  height: 3em;
  margin-top: 100px;
`;
const DivImage = styled.div`
  font-size: ${(props) => props.fontSize};
  color: ${(props) => props.color};
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 30px;
  font-weight: ${(props) => props.fontWeight};
`;

const Image = styled.img<{ size: string; top: string; width: string }>`
  height: ${($props) => $props.size};
  width: ${($props) => ($props.width ? $props.width : $props.size)};
  margin: auto;
  cursor: ${(props) => props.cursor};
  margin-top: ${(props) => props.marginTop};
`;

interface WalletData {
  account: string;
  publicKey: string;
  connectedSites: string[];
}

const LoginDapp = (props: any) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setValue,
    clearErrors,
  } = useForm();
  const { setIsLocked } = useSettingsContext();
  const { location } = props;
  const { state } = location;
  const dispatch = useAppDispatch();
  const { selectedNetwork, networks, passwordHash } = useAppSelector((state) => state.extensions);
  const { publicKey, account, connectedSites } = useAppSelector((state) => state.wallet);
  const from = state?.from ?? null;
  const history = useHistory();

  useEffect(() => {
    if (passwordHash) {
      if (from) {
        history.push(from);
      } else {
        getLocalDapps(
          async (dapps) => {
            if (dapps?.bring) {
              return;
            }
            const walletData: WalletData = {
              account,
              publicKey,
              connectedSites,
            };
            switch (dapps?.message) {
              case 'res_checkStatus': {
                updateCheckStatusMessage(
                  {
                    account: walletData,
                    message: 'Connected successfully',
                    status: 'success',
                  },
                  dapps.tabId,
                );
                break;
              }
              default: {
                updateAccountMessage(
                  {
                    wallet: walletData,
                    message: 'Get account information successfully',
                    status: 'success',
                  },
                  dapps.tabId,
                );
              }
            }

            setTimeout(() => {
              window.close();
            }, 300);
          },
          () => {},
        );
      }
    }
  }, [publicKey, account, connectedSites, passwordHash, selectedNetwork, history]);

  const handleSignIn = async () => {
    const password = getValues('password');
    getOldLocalPassword(
      async (oldHashPassword) => {
        // old password found
        // check if is correct
        const isValidOldPassword = checkIsValidOldPassword(password, oldHashPassword);
        if (isValidOldPassword) {
          // get seedphrase and store again
          getLocalSeedPhrase(
            async (secretKey) => {
              try {
                const plainSeedPhrase = decryptKey(secretKey, oldHashPassword);
                // save new hashed secretKey
                const hashPassword = hash(password);
                setLocalPassword(hashPassword);
                dispatch(require2FA());
                await initLocalWallet(plainSeedPhrase, hashPassword);
                removeOldLocalPassword();
                // restore data
                window.location.reload();
              } catch (error) {
                console.error('Error initializing wallet:', error);
                setError('password', { type: 'manual', message: 'Error initializing wallet' });
              }
            },
            () => {},
          );
        } else {
          setError('password', { type: 'manual', message: 'Invalid Password' });
        }
      },
      async () => {
        const isValid = await isValidPassword(password);
        if (isValid) {
          const hashPassword = hash(password);
          setLocalPassword(hashPassword);
          dispatch(require2FA());
          initDataFromLocal(selectedNetwork, networks);
          setIsLocked(false);
          
          getLocalDapps(
            async (dapps) => {
              if (dapps?.bring) {
                await new Promise((resolve) => setTimeout(resolve, 800));
                getLocalWallets(
                  selectedNetwork?.networkId || 'mainnet01',
                  async (walletsList) => {
                    if (walletsList && walletsList.length >= 2) {
                      history.push('/bring-select-account');
                    } else {
                      const currentAccount = await new Promise((resolve) => {
                        chrome.storage.local.get('selectedWallet', (wallet) => {
                          if (wallet?.selectedWallet?.account) {
                            chrome.storage.session.get('accountPassword', (result) => {
                              const accountPassword = result?.accountPassword;
                              if (accountPassword) {
                                const decryptedAccount = decryptKey(wallet.selectedWallet.account, accountPassword);
                                resolve(decryptedAccount);
                              } else {
                                resolve(null);
                              }
                            });
                          } else {
                            resolve(null);
                          }
                        });
                      });
                      
                      if (currentAccount && typeof currentAccount === 'string') {
                        await setBringCashbackAddress(currentAccount);
                        chrome.runtime.sendMessage(
                          {
                            target: 'kda.background',
                            action: 'bring_resolveSelection',
                            tabId: dapps.tabId,
                            walletAddress: currentAccount,
                          },
                          () => {
                            setTimeout(() => {
                              window.close();
                            }, 300);
                          }
                        );
                      }
                    }
                  },
                  () => {}
                );
              }
            },
            () => {}
          );
        } else {
          setError('password', { type: 'manual', message: 'Invalid Passwords' });
        }
      },
    );
  };

  return (
    <CreatePasswordWrapper>
      <Body>
        <DivImage marginBottom="30px" marginTop="30px">
          <Image src={images.eckoWalletIcon} size={80} width={80} alt="logo" />
        </DivImage>
        <Title>Input Password Sign In</Title>
        <Wrapper onSubmit={handleSubmit(handleSignIn)} id="sign-in-form">
          <DivBody>
            <BaseTextInput
              inputProps={{
                type: 'password',
                placeholder: 'Input password',
                ...register('password', {
                  required: {
                    value: true,
                    message: 'This field is required.',
                  },
                  minLength: {
                    value: 8,
                    message: 'Password should be minimum 8 characters.',
                  },
                  maxLength: {
                    value: 256,
                    message: 'Password should be maximum 256 characters.',
                  },
                }),
              }}
              typeInput="password"
              title="Password"
              height="auto"
              onChange={(e) => {
                clearErrors('password');
                setValue('password', e.target.value);
              }}
            />
          </DivBody>
          {errors.password && <InputError>{errors.password.message}</InputError>}
        </Wrapper>
      </Body>
      <Footer>
        <Button label="Sign In" size="full" form="sign-in-form" />
      </Footer>
    </CreatePasswordWrapper>
  );
};

export default LoginDapp;
