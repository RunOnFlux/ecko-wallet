/* eslint-disable no-console */
import { useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Button from 'src/components/Buttons';
import { SettingsContext } from 'src/contexts/SettingsContext';
import { BaseSelect, InputError } from 'src/baseComponent';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { autoLockOptions } from 'src/utils/config';
import { DivFlex, StickyFooter } from 'src/components';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Toast from 'src/components/Toast/Toast';
import { ErrorWrapper } from 'src/pages/SendTransactions/styles';
import { Content, SettingBody } from '../style';
import { DivBodyNetwork } from '../Networks/views/style';
import { Body, DivError } from '../Contact/views/style';
import { useTranslation } from 'react-i18next';

const PageLockSettings = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { data: settings, setSettings } = useContext(SettingsContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<any>({ defaultValues: { lockTime: autoLockOptions?.find((l) => l.value === settings?.lockTime) } });

  const onSave = ({ lockTime }) => {
    setSettings({
      ...settings,
      lockTime: lockTime?.value,
    });
    toast.success(<Toast type="success" content={t('settings.lockSettingsPage.saved')} />);
    history.push('/setting');
  };

  const restoreDefault = () => {
    onSave({ lockTime: { value: autoLockOptions[0].value } });
  };

  const onErrors = () => {};

  return (
    <SettingBody>
      <div style={{ padding: '0 24px' }}>
        <NavigationHeader title={t('settings.lockSettingsPage.title')} onBack={() => history.push('/setting')} />
      </div>
      <Body>
        <Content>
          <form onSubmit={handleSubmit(onSave, onErrors)} id="save-lock-timeout">
            <DivBodyNetwork>
              <Controller
                control={control}
                name="lockTime"
                rules={{
                  required: {
                    value: true,
                    message: t('settings.lockSettingsPage.required'),
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <BaseSelect
                    placeholder={t('settings.lockSettingsPage.placeholder')}
                    selectProps={{
                      onChange,
                      onBlur,
                      value,
                    }}
                    options={autoLockOptions}
                    title={t('settings.lockSettingsPage.selectTitle')}
                    height="auto"
                  />
                )}
              />
            </DivBodyNetwork>
            {errors.lockTime && (
              <ErrorWrapper>
                <DivError>
                  <InputError marginTop="0">{errors.lockTime.message}</InputError>
                </DivError>
              </ErrorWrapper>
            )}
          </form>
          <StickyFooter>
            <DivFlex gap="10px" style={{ width: '90%', maxWidth: 890 }}>
              <Button size="full" label={t('settings.lockSettingsPage.restore')} variant="disabled" onClick={restoreDefault} />
              <Button size="full" label={t('settings.lockSettingsPage.save')} variant="primary" form="save-lock-timeout" type="submit" />
            </DivFlex>
          </StickyFooter>
        </Content>
      </Body>
    </SettingBody>
  );
};

export default PageLockSettings;
