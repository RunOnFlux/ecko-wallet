/* eslint-disable no-console */
import { useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from 'src/components/Buttons';
import { SettingsContext, TxSettings } from 'src/contexts/SettingsContext';
import { BaseTextInput, InputError } from 'src/baseComponent';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import BigNumber from 'bignumber.js';
import { DivFlex, StickyFooter } from 'src/components';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Toast from 'src/components/Toast/Toast';
import { CONFIG } from 'src/utils/config';
import { ErrorWrapper } from 'src/pages/SendTransactions/styles';
import { Content, SettingBody } from '../style';
import { DivBodyNetwork } from '../Networks/views/style';
import { Body, DivError } from '../Contact/views/style';

const PageTransaction = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { data: settings, setTxSettings } = useContext(SettingsContext);
  const txSettings = settings?.txSettings;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getDefaultData = (): any => {
    const gasPriceDecimals = new BigNumber(txSettings?.gasPrice ?? CONFIG.GAS_PRICE).decimalPlaces();
    const xChainGasPriceDecimals = new BigNumber(txSettings?.xChainGasPrice ?? CONFIG.X_CHAIN_GAS_PRICE).decimalPlaces();
    return {
      ...txSettings,
      gasPrice: gasPriceDecimals ? txSettings?.gasPrice?.toFixed(gasPriceDecimals) : CONFIG.GAS_PRICE,
      xChainGasPrice: xChainGasPriceDecimals ? txSettings?.xChainGasPrice?.toFixed(xChainGasPriceDecimals) : CONFIG.X_CHAIN_GAS_PRICE,
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({ defaultValues: getDefaultData() });

  const onSave = (dataSubmit: TxSettings) => {
    const toSubmit = {
      ...dataSubmit,
      gasLimit: Number(dataSubmit.gasLimit),
      gasPrice: Number(dataSubmit.gasPrice),
      xChainGasLimit: Number(dataSubmit.xChainGasLimit),
      xChainGasPrice: Number(dataSubmit.xChainGasPrice),
    };
    setTxSettings(toSubmit);
    toast.success(<Toast type="success" content={t('settings.txSettingsPage.successSave')} />);
    history.push('/setting');
  };

  const restoreDefault = () => {
    onSave({
      gasLimit: CONFIG.GAS_LIMIT,
      gasPrice: CONFIG.GAS_PRICE,
      xChainGasLimit: CONFIG.X_CHAIN_GAS_LIMIT,
      xChainGasPrice: CONFIG.X_CHAIN_GAS_PRICE,
      xChainGasStation: CONFIG.X_CHAIN_GAS_STATION,
      xChainTTL: CONFIG.X_CHAIN_TTL,
    });
  };

  const onErrors = () => {};

  return (
    <SettingBody>
      <div style={{ padding: '0 24px' }}>
        <NavigationHeader title={t('settings.txSettingsPage.title')} onBack={() => history.push('/setting')} />
      </div>
      <Body>
        <Content>
          <form onSubmit={handleSubmit(onSave, onErrors)} id="save-network">
            <DivBodyNetwork>
              <BaseTextInput
                title={t('settings.txSettingsPage.gasLimit')}
                height="auto"
                onChange={(e) => setValue('gasLimit', e.target.value)}
                inputProps={{
                  type: 'number',
                  placeholder: t('settings.txSettingsPage.gasLimitPlaceholder'),
                  ...register('gasLimit', { required: true }),
                }}
              />
              {errors.gasLimit && (
                <ErrorWrapper>
                  <DivError>
                    <InputError marginTop="0">{errors.gasLimit.message}</InputError>
                  </DivError>
                </ErrorWrapper>
              )}
            </DivBodyNetwork>

            <DivBodyNetwork>
              <BaseTextInput
                title={t('settings.txSettingsPage.finishCrossChain')}
                height="auto"
                onChange={(e) => setValue('xChainGasStation', e.target.value)}
                inputProps={{
                  placeholder: t('settings.txSettingsPage.finishCrossChainPlaceholder'),
                  ...register('xChainGasStation', { required: true }),
                }}
              />
              {errors.xChainGasStation && (
                <ErrorWrapper>
                  <DivError>
                    <InputError marginTop="0">{errors.xChainGasStation.message}</InputError>
                  </DivError>
                </ErrorWrapper>
              )}
            </DivBodyNetwork>

            <DivBodyNetwork>
              <BaseTextInput
                title={t('settings.txSettingsPage.crossChainGasLimit')}
                height="auto"
                onChange={(e) => setValue('xChainGasLimit', e.target.value)}
                inputProps={{
                  type: 'number',
                  placeholder: t('settings.txSettingsPage.crossChainGasLimitPlaceholder'),
                  ...register('xChainGasLimit', {
                    required: { value: true, message: t('settings.txSettingsPage.requiredField') },
                  }),
                }}
              />
              {errors.xChainGasLimit && (
                <ErrorWrapper>
                  <DivError>
                    <InputError marginTop="0">{errors.xChainGasLimit.message}</InputError>
                  </DivError>
                </ErrorWrapper>
              )}
            </DivBodyNetwork>

            <DivBodyNetwork>
              <BaseTextInput
                title={t('settings.txSettingsPage.crossChainGasPrice')}
                height="auto"
                onChange={(e) => setValue('xChainGasPrice', e.target.value)}
                inputProps={{
                  type: 'number',
                  step: 'any',
                  placeholder: t('settings.txSettingsPage.crossChainGasPricePlaceholder'),
                  ...register('xChainGasPrice', {
                    required: { value: true, message: t('settings.txSettingsPage.requiredField') },
                    validate: { required: (val) => !Number.isNaN(val) || t('settings.txSettingsPage.invalidValue') },
                  }),
                }}
              />
              {errors.xChainGasPrice && (
                <ErrorWrapper>
                  <DivError>
                    <InputError marginTop="0">{errors.xChainGasPrice.message}</InputError>
                  </DivError>
                </ErrorWrapper>
              )}
            </DivBodyNetwork>
          </form>

          <StickyFooter>
            <DivFlex gap="10px" style={{ width: '90%', maxWidth: 890 }}>
              <Button size="full" label={t('settings.txSettingsPage.restoreDefault')} variant="disabled" onClick={restoreDefault} />
              <Button size="full" label={t('settings.txSettingsPage.save')} variant="primary" form="save-network" type="submit" />
            </DivFlex>
          </StickyFooter>
        </Content>
      </Body>
    </SettingBody>
  );
};

export default PageTransaction;
