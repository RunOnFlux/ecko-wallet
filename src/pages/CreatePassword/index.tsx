import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { BaseTextInput, InputError } from 'src/baseComponent';
import { hash as kadenaHash } from '@kadena/cryptography-utils';
import { kadenaCheckMnemonic } from '@kadena/hd-wallet/chainweaver';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { initLocalWallet, setLocalPassword, updateWallets } from 'src/utils/storage';
import Toast from 'src/components/Toast/Toast';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Button from 'src/components/Buttons';
import { PasswordForm } from 'src/components/PasswordForm';
import { useAppSelector } from 'src/stores/hooks';
import { useTranslation } from 'react-i18next';

const CreatePasswordWrapper = styled.div`
  padding: 0 20px;
`;
const Body = styled.div`
  height: auto;
  width: 100%;
  font-size: 16px;
`;
const DivBody = styled.div`
  width: 100%;
  text-align: left;
  font-size: 16px;
  line-height: 40px;
  display: flex;
  align-items: center;
  margin-top: 20px;
`;
const Footer = styled.div`
  width: 100%;
  height: 3em;
  margin-top: 35px;
`;
const Wrapper = styled.form`
  display: block;
`;

const CreatePassword = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
    clearErrors,
    control,
  } = useForm();
  const { isCreateSeedPhrase, selectedNetwork } = useAppSelector((state) => state.extensions);
  const { t } = useTranslation();
  const history = useHistory();

  const onStorePassword = async (data, path) => {
    try {
      const hash = kadenaHash(data.password);
      setLocalPassword(hash);
      toast.success(<Toast type="success" content={t('createPassword.successCreate')} />);

      if (isCreateSeedPhrase) {
        const newStateWallet = await initLocalWallet(data.seedPhrase, hash);
        updateData(hash, path, newStateWallet);
        history.push('/sign-in');
      } else {
        updateWallets(selectedNetwork.networkId);
        history.push(path);
        updateData(hash, path, null);
      }
    } catch (error) {
      console.error('Error storing password:', error);
      toast.error(<Toast type="fail" content={t('createPassword.errorCreate')} />);
    }
  };

  const updateData = (hash, path, wallet) => {
    setTimeout(() => {
      (window as any)?.chrome?.runtime?.sendMessage({
        target: 'kda.extension',
        action: 'sync_data',
        type: 'create_password',
        passwordHash: hash,
        path,
        wallet,
      });
    }, 300);
  };

  const onCheck = async (data) => {
    const { seedPhrase } = data;
    if (isCreateSeedPhrase) {
      const isSeedPhraseValid = kadenaCheckMnemonic(seedPhrase);
      if (!isSeedPhraseValid) {
        toast.error(<Toast type="fail" content={t('createPassword.invalidPhrase')} />);
      } else {
        await onStorePassword(data, '/sign-in');
      }
    } else {
      await onStorePassword(data, '/seed-phrase');
    }
  };

  const goBack = () => {
    history.push('/init-seed-phrase');
  };

  return (
    <CreatePasswordWrapper>
      <NavigationHeader title={isCreateSeedPhrase ? t('createPassword.importFromPhrase') : t('createPassword.createPassword')} onBack={goBack} />
      <Body>
        <Wrapper onSubmit={handleSubmit(onCheck)} id="create-password-form">
          {isCreateSeedPhrase && (
            <>
              <DivBody>
                <BaseTextInput
                  inputProps={{
                    type: 'password',
                    placeholder: t('createPassword.pastePhrase'),
                    ...register('seedPhrase', {
                      required: {
                        value: true,
                        message: t('createPassword.requiredField'),
                      },
                      maxLength: {
                        value: 256,
                        message: t('createPassword.phraseTooLong'),
                      },
                    }),
                  }}
                  typeInput="password"
                  title={t('createPassword.secretRecoveryPhrase')}
                  height="auto"
                  onChange={(e) => {
                    clearErrors('seedPhrase');
                    setValue('seedPhrase', e.target.value);
                  }}
                />
              </DivBody>
              <>{errors.seedPhrase && <InputError>{errors.seedPhrase.message}</InputError>}</>
            </>
          )}
          <PasswordForm clearErrors={clearErrors} control={control} errors={errors} getValues={getValues} register={register} setValue={setValue} />
        </Wrapper>
      </Body>
      <Footer>
        <Button
          label={isCreateSeedPhrase ? t('createPassword.import') : t('createPassword.create')}
          size="full"
          variant="primary"
          form="create-password-form"
        />
      </Footer>
    </CreatePasswordWrapper>
  );
};

export default CreatePassword;
