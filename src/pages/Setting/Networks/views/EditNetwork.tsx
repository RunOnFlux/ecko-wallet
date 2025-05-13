/* eslint-disable no-console */
import { useState } from 'react';
import Button from 'src/components/Buttons';
import { BaseTextInput, InputError } from 'src/baseComponent';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { DivFlex, SecondaryLabel } from 'src/components';
import { convertNetworks, getTimestamp } from 'src/utils';
import { getLocalNetworks, setLocalNetworks, setLocalSelectedNetwork } from 'src/utils/storage';
import { useAppSelector } from 'src/stores/hooks';
import { getSelectedNetwork, setNetworks, setSelectedNetwork } from 'src/stores/slices/extensions';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { useSelectNetwork } from 'src/hooks/wallet';
import { Content } from '../../style';
import { ErrorWrapper, Footer } from '../../../SendTransactions/styles';
import { DivBodyNetwork } from './style';
import { DivError } from '../../Contact/views/style';
import { useTranslation } from 'react-i18next';

type Props = {
  onBack: any;
  network: any;
  isEdit: boolean;
  onClickPopup: Function;
};

const EditNetwork = (props: Props) => {
  const { t } = useTranslation();
  const { onBack, network, isEdit, onClickPopup } = props;
  const [settingNetwork, setSettingNetwork] = useState<any>(network);
  const [errMessageDuplicateUrl, setErrorMessageDuplicateUrl] = useState('');
  const [errMessageDuplicateNetworksId, setErrorMessageDuplicateNetworksId] = useState('');
  const networks = useAppSelector((state) => state.extensions.networks);
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const [isModalRemoveNetwork, setModalRemoveNetwork] = useState(false);
  const selectNetwork = useSelectNetwork();
  const isEditingSelectedNetwork = selectedNetwork.id === network.id;
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    setValue,
  } = useForm();
  const id = network.id ? network.id : getTimestamp();

  const onSave = () => {
    const alertText = network.id ? t('settings.networksPage.editSuccess') : t('settings.networksPage.addSuccess');
    const newNetwork = {
      id: id.toString(),
      name: settingNetwork.name.trim(),
      url: settingNetwork.url,
      explorer: settingNetwork.explorer,
      networkId: settingNetwork.networkId.trim(),
      isDefault: false,
    };

    if (checkDuplicateUrl()) {
      setErrorMessageDuplicateUrl(t('settings.networksPage.errorUrl'));
      return;
    }

    if (isEditingSelectedNetwork) {
      setSelectedNetwork(newNetwork);
      setLocalSelectedNetwork(newNetwork);
    }

    getLocalNetworks(
      (data) => {
        const localNetworks = data;
        localNetworks[`${newNetwork.id}`] = newNetwork;
        setLocalNetworks(localNetworks);
        setNetworks(convertNetworks(localNetworks));
        onBack();
        toast.success(<Toast type="success" content={alertText} />);
      },
      () => {
        const localNetworks = {};
        localNetworks[`${newNetwork.id}`] = newNetwork;
        setLocalNetworks(localNetworks);
        setNetworks(convertNetworks(localNetworks));
        onBack();
        toast.success(<Toast type="success" content={alertText} />);
      },
    );
  };

  const checkDuplicateUrl = (): boolean => {
    const duplicate = networks.some((itemNetwork: any) => itemNetwork.url === settingNetwork.url && itemNetwork.id !== id);
    return duplicate;
  };

  const onErrors = (err) => {
    console.log('err', err);
  };

  const handleChangeNetwork = (e, key) => {
    const { value } = e.target;
    const newValue = { ...settingNetwork };
    newValue[key] = value;
    setSettingNetwork(newValue);
  };

  const deleteNetwork = () => {
    getLocalNetworks(
      (data) => {
        const localNetworks = data;
        delete localNetworks[`${id}`];
        setLocalNetworks(localNetworks);
        setNetworks(convertNetworks(localNetworks));
        onClickPopup();
        setModalRemoveNetwork(false);

        if (isEditingSelectedNetwork) {
          selectNetwork('0');
        }

        toast.success(<Toast type="success" content={t('settings.networksPage.deleteSuccess')} />);
      },
      () => {},
    );
  };

  const checkInValidURL = (str) => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$',
      'i',
    );
    return !!pattern.test(str);
  };

  return (
    <Content>
      <form onSubmit={handleSubmit(onSave, onErrors)} id="save-network">
        <DivBodyNetwork>
          <BaseTextInput
            inputProps={{
              value: settingNetwork.name,
              placeholder: t('settings.networksPage.placeholderName'),
              ...register('name', {
                required: {
                  value: true,
                  message: t('common.requiredField'),
                },
                maxLength: {
                  value: 1000,
                  message: t('settings.networksPage.nameMax'),
                },
                validate: {
                  required: (val) => val.trim().length > 0 || t('common.invalidData'),
                },
              }),
            }}
            title={t('settings.networksPage.titleName')}
            height="auto"
            onChange={(e) => {
              clearErrors('name');
              handleChangeNetwork(e, 'name');
              setValue('name', e.target.value);
            }}
            onBlur={(e) => {
              setValue('name', e.target.value.trim());
              handleChangeNetwork(e, 'name');
            }}
          />
          {errors.name && (
            <ErrorWrapper>
              <DivError>
                <InputError marginTop="0">{errors.name.message}</InputError>
              </DivError>
            </ErrorWrapper>
          )}
        </DivBodyNetwork>

        <DivBodyNetwork>
          <BaseTextInput
            inputProps={{
              value: settingNetwork.url,
              placeholder: t('settings.networksPage.placeholderUrl'),
              ...register('url', {
                required: {
                  value: true,
                  message: t('common.requiredField'),
                },
                maxLength: {
                  value: 1000,
                  message: t('settings.networksPage.urlMax'),
                },
                validate: {
                  required: (val) => val.trim().length > 0 || t('common.invalidUrl'),
                  match: (val) => checkInValidURL(val) || t('common.invalidUrl'),
                },
              }),
            }}
            title={t('settings.networksPage.titleUrl')}
            height="auto"
            onChange={(e) => {
              clearErrors('url');
              handleChangeNetwork(e, 'url');
              setValue('url', e.target.value);
              setErrorMessageDuplicateUrl('');
            }}
            onBlur={(e) => {
              setValue('url', e.target.value.trim());
              handleChangeNetwork(e, 'url');
            }}
          />
          {errors.url && (
            <ErrorWrapper>
              <DivError>
                <InputError marginTop="0">{errors.url.message}</InputError>
              </DivError>
            </ErrorWrapper>
          )}
          {errMessageDuplicateUrl && (
            <ErrorWrapper>
              <DivError>
                <InputError marginTop="0">{errMessageDuplicateUrl}</InputError>
              </DivError>
            </ErrorWrapper>
          )}
        </DivBodyNetwork>

        <DivBodyNetwork>
          <BaseTextInput
            inputProps={{
              value: settingNetwork.explorer,
              placeholder: t('settings.networksPage.placeholderExplorer'),
              ...register('explorer', {
                required: {
                  value: true,
                  message: t('common.requiredField'),
                },
                maxLength: {
                  value: 1000,
                  message: t('settings.networksPage.explorerMax'),
                },
                validate: {
                  required: (val) => val.trim().length > 0 || t('common.invalidData'),
                  match: (val) => checkInValidURL(val) || t('common.invalidUrl'),
                },
              }),
            }}
            title={t('settings.networksPage.titleExplorer')}
            height="auto"
            onChange={(e) => {
              clearErrors('explorer');
              handleChangeNetwork(e, 'explorer');
              setValue('explorer', e.target.value);
            }}
            onBlur={(e) => {
              setValue('explorer', e.target.value.trim());
              handleChangeNetwork(e, 'explorer');
            }}
          />
          {errors.explorer && (
            <ErrorWrapper>
              <DivError>
                <InputError marginTop="0">{errors.explorer.message}</InputError>
              </DivError>
            </ErrorWrapper>
          )}
        </DivBodyNetwork>

        <DivBodyNetwork>
          <BaseTextInput
            inputProps={{
              value: settingNetwork.networkId,
              placeholder: t('settings.networksPage.placeholderNetworkId'),
              ...register('networkId', {
                required: {
                  value: true,
                  message: t('common.requiredField'),
                },
                maxLength: {
                  value: 1000,
                  message: t('settings.networksPage.networkIdMax'),
                },
                validate: {
                  required: (val) => val.trim().length > 0 || t('common.invalidData'),
                },
              }),
            }}
            title={t('settings.networksPage.titleNetworkId')}
            height="auto"
            onChange={(e) => {
              clearErrors('networkId');
              handleChangeNetwork(e, 'networkId');
              setValue('networkId', e.target.value);
              setErrorMessageDuplicateNetworksId('');
            }}
            onBlur={(e) => {
              setValue('networkId', e.target.value.trim());
              handleChangeNetwork(e, 'networkId');
            }}
          />
          {errors.networkId && (
            <ErrorWrapper>
              <DivError>
                <InputError marginTop="0">{errors.networkId.message}</InputError>
              </DivError>
            </ErrorWrapper>
          )}
          {errMessageDuplicateNetworksId && (
            <ErrorWrapper>
              <DivError>
                <InputError marginTop="0">{errMessageDuplicateNetworksId}</InputError>
              </DivError>
            </ErrorWrapper>
          )}
        </DivBodyNetwork>
      </form>

      <Footer>
        {isEdit && network.id ? (
          <>
            <DivFlex gap="10px">
              <Button size="full" label={t('settings.networksPage.remove')} variant="remove" onClick={() => setModalRemoveNetwork(true)} />
              <Button size="full" label={t('settings.networksPage.save')} variant="primary" form="save-network" />
            </DivFlex>
            {isModalRemoveNetwork && (
              <ModalCustom isOpen={isModalRemoveNetwork} title={t('settings.networksPage.confirmRemove')} showCloseIcon={false}>
                <DivFlex flexDirection="column">
                  <SecondaryLabel fontSize={16} textCenter style={{ flex: 1 }}>
                    {t('settings.networksPage.confirmRemoveDesc')}
                  </SecondaryLabel>
                  <DivFlex padding="24px" gap="10px">
                    <Button size="full" label={t('common.cancel')} variant="disabled" onClick={() => setModalRemoveNetwork(false)} />
                    <Button size="full" label={t('common.confirm')} variant="primary" onClick={deleteNetwork} />
                  </DivFlex>
                </DivFlex>
              </ModalCustom>
            )}
          </>
        ) : (
          <DivFlex>
            <Button size="full" label={t('settings.networksPage.save')} variant="primary" form="save-network" />
          </DivFlex>
        )}
      </Footer>
    </Content>
  );
};

export default EditNetwork;
