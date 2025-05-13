import { useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { hash } from '@kadena/cryptography-utils';
import { useAppDispatch, useAppSelector } from 'src/stores/hooks';
import { require2FA } from 'src/stores/slices/auth';
import images from 'src/images';
import Button from 'src/components/Buttons';
import { CommonLabel, DivFlex } from 'src/components';
import { BaseTextInput, InputError } from 'src/baseComponent';
import { useSettingsContext } from 'src/contexts/SettingsContext';
import { useHistory } from 'react-router-dom';
import { useGoHome } from 'src/hooks/ui';
import { checkIsValidOldPassword, decryptKey } from 'src/utils/security';
import {
  getLocalPassword,
  getLocalSeedPhrase,
  getLocalSelectedWallet,
  getOldLocalPassword,
  initDataFromLocal,
  initLocalWallet,
  removeOldLocalPassword,
  setLocalPassword,
} from 'src/utils/storage';
import { DivError } from '../Setting/Contact/views/style';
import { WelcomeBackground } from '../InitSeedPhrase';

export const isValidPassword = async (password) => {
  const hashPassword = hash(password);
  return new Promise<Boolean>((resolve) => {
    getLocalSelectedWallet(
      (w) => {
        try {
          const decryptedAccount = decryptKey(w.account, hashPassword);
          if (typeof decryptedAccount === 'string' && decryptedAccount?.length) {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          resolve(false);
        }
      },
      () => {
        resolve(false);
      },
    );
  });
};

const DivImage = styled.div`
  font-size: ${(props) => props.fontSize};
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  flex-direction: column;
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

const SignIn = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setValue,
    clearErrors,
  } = useForm();

  const { selectedNetwork, networks } = useAppSelector((state) => state.extensions);
  const { setIsLocked } = useSettingsContext();
  const dispatch = useAppDispatch();
  const goHome = useGoHome();
  const history = useHistory();

  useEffect(() => {
    getLocalPassword(
      (p) => {
        if (p) {
          goHome();
        }
      },
      () => {},
    );
  }, []);

  const saveSessionPassword = (password) => {
    const hashPassword = hash(password);
    setLocalPassword(hashPassword);
    dispatch(require2FA());
    initDataFromLocal(selectedNetwork, networks);
  };

  const unlockWallet = () => {
    setIsLocked(false);
    getLocalSelectedWallet(
      () => {
        goHome();
      },
      () => {
        history.push('/init');
      },
    );
    (window as any).chrome.runtime.sendMessage({
      target: 'kda.extension',
      action: 'sync_data',
    });
  };

  const handleSignIn = async () => {
    const password = getValues('password');
    getOldLocalPassword(
      async (oldHashPassword) => {
        const isValidOldPassword = checkIsValidOldPassword(password, oldHashPassword);
        if (isValidOldPassword) {
          getLocalSeedPhrase(
            async (secretKey) => {
              try {
                const plainSeedPhrase = decryptKey(secretKey, oldHashPassword);
                const hashPassword = hash(password);
                setLocalPassword(hashPassword);
                dispatch(require2FA());
                await initLocalWallet(plainSeedPhrase, hashPassword);
                removeOldLocalPassword();
                window.location.reload();
              } catch (error) {
                console.error('Error initializing wallet:', error);
                setError('password', { type: 'manual', message: t('signIn.initWalletError') });
              }
            },
            () => {},
          );
        } else {
          setError('password', { type: 'manual', message: t('signIn.invalidPassword') });
        }
      },
      async () => {
        const isValid = await isValidPassword(password);
        if (!isValid) {
          setError('password', { type: 'manual', message: t('signIn.invalidPassword') });
        } else {
          saveSessionPassword(password);
          unlockWallet();
        }
      },
    );
  };

  return (
    <WelcomeBackground>
      <DivFlex flexDirection="column" style={{ height: '100vh', padding: '0 24px' }} justifyContent="center" gap="45px">
        <DivImage marginBottom="30px" marginTop="30px">
          <Image src={images.eckoWalletLogo} size={200} width={200} alt="logo" />
          <CommonLabel color="#fff" fontSize={18} fontWeight={500} style={{ marginTop: 20 }}>
            {t('signIn.loginTitle')}
          </CommonLabel>
        </DivImage>
        <form onSubmit={handleSubmit(handleSignIn)} id="sign-in-form">
          <DivFlex flexDirection="column">
            <BaseTextInput
              inputProps={{
                type: 'password',
                placeholder: t('signIn.passwordPlaceholder'),
                ...register('password', {
                  required: { value: true, message: t('signIn.required') },
                  minLength: { value: 8, message: t('signIn.minLength') },
                  maxLength: { value: 256, message: t('signIn.maxLength') },
                }),
                style: { color: '#fff' },
              }}
              wrapperStyle={{
                background: 'linear-gradient(114.43deg, #293445 5.17%, #292A45 65.62%)',
                borderRadius: 25,
              }}
              typeInput="password"
              title={t('signIn.passwordTitle')}
              height="auto"
              onChange={(e) => {
                clearErrors('password');
                setValue('password', e.target.value);
              }}
            />
            <DivError>{errors.password && <InputError marginTop="0">{errors.password.message}</InputError>}</DivError>
          </DivFlex>
          <Button type="submit" size="full" form="sign-in-form" label={t('signIn.signInButton')} style={{ marginTop: 80 }} />
        </form>
      </DivFlex>
    </WelcomeBackground>
  );
};

export default SignIn;
