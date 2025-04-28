import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { BaseTextInput, InputError } from 'src/baseComponent';
import Button from 'src/components/Buttons';
import styled from 'styled-components';
import { setCurrentWallet, setWallets } from 'src/stores/slices/wallet';
import { setLocalActivities, setLocalSelectedWallet, setLocalWallets } from 'src/utils/storage';
import { encryptKey } from 'src/utils/security';
import { useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DivFlex } from 'src/components';
import { isValidPassword } from 'src/pages/SignIn';
import { useAppSelector } from 'src/stores/hooks';

const DivChild = styled.div`
  font-size: ${(props) => props.fontSize};
  color: ${(props) => props.color};
  margin-top: ${(props) => props.marginTop};
  margin-left: ${(props) => props.marginLeft};
  margin-right: ${(props) => props.marginRight};
  margin-bottom: ${(props) => props.marginBottom};
  font-weight: ${(props) => props.fontWeight};
`;

const RemoveWalletContent = styled.div`
  padding: 20px;
`;
const RemoveWalletText = styled(DivChild)`
  text-align: center;
  color: ${({ theme }) => theme.text.primary};
`;

const DesRemoveWallet = styled.div`
  text-align: center;
  font-size: 16px;
  color: ${({ theme }) => theme.text.primary};
  @media screen and (max-width: 480px) {
    font-size: 16px;
  }
`;

const ActionButton = styled(DivFlex)`
  justify-content: space-between;
  gap: 5px;
`;

const DivBody = styled.div`
  width: 100%;
  text-align: left;
  font-size: 16px;
  line-height: 40px;
  align-items: center;
  margin: 30px 0 40px 0;
`;

const DivError = styled.div`
  margin-top: 10px;
  min-height: 50px;
`;

const RemoveWalletPopup = (props: Props) => {
  const { t } = useTranslation();
  const { onClose } = props;
  const history = useHistory();
  const { passwordHash, selectedNetwork } = useAppSelector((state) => state.extensions);
  const { wallets, account } = useAppSelector((state) => state.wallet);
  const [passwordInput, setPasswordInput] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm();

  const onChangeInput = (e) => {
    clearErrors('password');
    setPasswordInput(e.target.value);
    setValue('password', e.target.value);
  };

  const confirm = async () => {
    const isValid = await isValidPassword(passwordInput);
    if (isValid) {
      const newWallets = wallets.filter((w: any) => w.account !== account);

      if (newWallets.length === 0) {
        setCurrentWallet({
          chainId: '0',
          account: '',
          publicKey: '',
          secretKey: '',
          connectedSites: [],
        });
        setLocalSelectedWallet({
          chainId: '0',
          account: '',
          publicKey: '',
          secretKey: '',
          connectedSites: [],
        });
        setLocalWallets(selectedNetwork.networkId, []);
        setWallets([]);
        setLocalActivities(selectedNetwork.networkId, account, []);
        history.push('/init');
      } else {
        setWallets(newWallets);
        setCurrentWallet(newWallets[0]);
        const newLocalWallets = newWallets.map((w: any) => ({
          account: encryptKey(w.account, passwordHash),
          alias: w.alias,
          publicKey: encryptKey(w.publicKey, passwordHash),
          secretKey: encryptKey(w.secretKey, passwordHash),
          chainId: w.chainId,
          connectedSites: w.connectedSites,
        }));
        setLocalSelectedWallet(newLocalWallets[0]);
        setLocalWallets(selectedNetwork.networkId, newLocalWallets);
        setLocalActivities(selectedNetwork.networkId, account, []);
      }
      onClose();
    } else {
      setError('password', { type: 'manual', message: t('removeWallet.invalidPassword') });
    }
  };

  const onError = (err) => {
    console.log('err', err);
  };

  return (
    <RemoveWalletContent>
      <RemoveWalletText fontSize="24px" fontWeight="700" marginBottom="20px">
        {t('removeWallet.title')}
      </RemoveWalletText>
      <DesRemoveWallet>{t('removeWallet.description')}</DesRemoveWallet>
      <form onSubmit={handleSubmit(confirm, onError)} id="validate-password-form">
        <DivBody>
          <BaseTextInput
            inputProps={{
              type: 'password',
              placeholder: t('removeWallet.passwordPlaceholder'),
              maxLength: '1000',
              ...register('password', {
                required: {
                  value: true,
                  message: t('removeWallet.passwordRequired'),
                },
                minLength: {
                  value: 8,
                  message: t('removeWallet.passwordMinLength'),
                },
                maxLength: {
                  value: 256,
                  message: t('removeWallet.passwordMaxLength'),
                },
              }),
            }}
            typeInput="password"
            title=""
            height="auto"
            onChange={onChangeInput}
          />
          <DivError>{errors.password && <InputError marginTop="0">{errors.password.message}</InputError>}</DivError>
        </DivBody>
      </form>
      <DivChild>
        <ActionButton>
          <Button onClick={onClose} label={t('removeWallet.cancel')} size="full" variant="secondary" />
          <Button form="validate-password-form" disabled={!passwordInput} label={t('removeWallet.remove')} size="full" />
        </ActionButton>
      </DivChild>
    </RemoveWalletContent>
  );
};

type Props = {
  onClose?: any;
};

export default RemoveWalletPopup;
