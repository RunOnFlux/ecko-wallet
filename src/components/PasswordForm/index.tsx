import styled from 'styled-components';
import { Control, Controller, FieldValues, UseFormClearErrors, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { BaseTextInput, InputAlert, InputError } from 'src/baseComponent';
import { Radio } from 'src/components/Radio';
import { useTranslation } from 'react-i18next';

const DivBody = styled.div`
  width: 100%;
  text-align: left;
  font-size: 16px;
  line-height: 40px;
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

interface PasswordFormProps {
  clearErrors: UseFormClearErrors<FieldValues>;
  control: Control<FieldValues, object>;
  errors: { [x: string]: any };
  getValues: UseFormGetValues<FieldValues>;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
}

export const PasswordForm = ({ clearErrors, control, errors, getValues, register, setValue }: PasswordFormProps) => {
  const { t } = useTranslation();

  const checkPasswordDiscouraged = (str) => {
    const pattern = /[^\w!?"'.,;@#]/;
    return pattern.test(str);
  };

  const password = getValues('password');
  const passwordIsDiscouraged = checkPasswordDiscouraged(password);

  return (
    <>
      <DivBody>
        <BaseTextInput
          inputProps={{
            type: 'password',
            placeholder: t('passwordForm.inputPassword'),
            ...register('password', {
              required: {
                value: true,
                message: t('passwordForm.requiredField'),
              },
              minLength: {
                value: 8,
                message: t('passwordForm.minPassword'),
              },
              maxLength: {
                value: 256,
                message: t('passwordForm.maxPassword'),
              },
            }),
          }}
          typeInput="password"
          title={t('passwordForm.newPassword')}
          height="auto"
          onChange={(e) => {
            clearErrors('password');
            setValue('password', e.target.value);
          }}
        />
      </DivBody>
      {errors.password && <InputError>{errors.password.message}</InputError>}
      <DivBody>
        <BaseTextInput
          inputProps={{
            type: 'password',
            placeholder: t('passwordForm.inputConfirmPassword'),
            ...register('confirmPassword', {
              required: {
                value: true,
                message: t('passwordForm.requiredField'),
              },
              maxLength: {
                value: 256,
                message: t('passwordForm.maxPassword'),
              },
              validate: {
                match: (v) => v === getValues('password') || t('passwordForm.passwordMismatch'),
              },
            }),
          }}
          typeInput="password"
          title={t('passwordForm.confirmPassword')}
          height="auto"
          onChange={(e) => {
            clearErrors('confirmPassword');
            setValue('confirmPassword', e.target.value);
          }}
        />
      </DivBody>
      {errors.confirmPassword && <InputError>{errors.confirmPassword.message}</InputError>}
      <DivBody>
        {passwordIsDiscouraged && (
          <Controller
            control={control}
            name="passwordDiscouragedConfirm"
            rules={{
              required: {
                value: true,
                message: t('passwordForm.requiredField'),
              },
            }}
            render={({ field: { value, name } }) => (
              <Radio onClick={() => setValue(name, !value)} isChecked={value} label={<InputAlert>{t('passwordForm.passwordWarning')}</InputAlert>} />
            )}
          />
        )}
      </DivBody>
      {errors.passwordDiscouragedConfirm && <InputError>{errors.passwordDiscouragedConfirm.message}</InputError>}
    </>
  );
};
