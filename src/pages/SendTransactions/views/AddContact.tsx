import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BaseTextInput, InputError } from 'src/baseComponent';
import Button from 'src/components/Buttons';
import { setContacts } from 'src/stores/slices/extensions';
import { convertContacts } from 'src/utils';
import { toast } from 'react-toastify';
import { DivFlex } from 'src/components';
import Toast from 'src/components/Toast/Toast';
import { getLocalContacts, setLocalContacts } from 'src/utils/storage';
import images from 'src/images';
import { PageConfirm, ItemWrapper } from './style';

type Props = {
  onClose: (result: string | false) => void;
  contact: any;
  networkId: string;
};

const AddContact = ({ onClose, contact, networkId }: Props) => {
  const { t } = useTranslation();
  const [isValue, setIsValue] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    clearErrors,
    setValue,
  } = useForm();

  const addContact = () => {
    const aliasName = getValues('alias');
    const newContact = {
      aliasName,
      accountName: contact.accountName,
      chainId: contact.chainId,
      pred: contact.pred,
      keys: contact.keys,
    };
    getLocalContacts(
      networkId,
      (data) => {
        const contacts = data;
        contacts[0] = contacts[0] || {};
        contacts[0][contact.accountName] = newContact;
        setLocalContacts(networkId, contacts);
        setContacts(convertContacts(contacts));
        onClose(aliasName);
        toast.success(<Toast type="success" content={t('settings.contactForm.successContactAdded')} />);
      },
      () => {
        const contacts: Record<string, any> = {};
        contacts[0] = { [contact.accountName]: newContact };
        setLocalContacts(networkId, contacts);
        setContacts(convertContacts(contacts));
        onClose(aliasName);
        toast.success(<Toast type="success" content={t('settings.contactForm.successContactAdded')} />);
      },
    );
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(<Toast type="success" content={t('settings.contactForm.copied')} />);
  };

  return (
    <PageConfirm>
      <div style={{ padding: 24 }}>
        <form onSubmit={handleSubmit(addContact)} id="contact-form">
          <ItemWrapper>
            <BaseTextInput
              title={t('settings.contactForm.enterAlias')}
              height="auto"
              inputProps={{
                placeholder: t('settings.contactForm.aliasPlaceholder'),
                maxLength: '1000',
                ...register('alias', {
                  required: {
                    value: true,
                    message: t('settings.contactForm.requiredField'),
                  },
                  maxLength: {
                    value: 256,
                    message: t('settings.contactForm.aliasMaxLength'),
                  },
                  validate: {
                    required: (val) => val.trim().length > 0 || t('settings.contactForm.invalidData'),
                  },
                }),
              }}
              onChange={(e) => {
                clearErrors('alias');
                setIsValue(!!e.target.value);
                setValue('alias', e.target.value);
              }}
            />
          </ItemWrapper>
          {errors.alias && <InputError>{errors.alias.message}</InputError>}

          <ItemWrapper>
            <BaseTextInput
              title={t('settings.contactForm.accountNameTitle')}
              height="auto"
              inputProps={{
                readOnly: true,
                value: contact.accountName,
              }}
              image={{
                width: '12px',
                height: '12px',
                src: images.wallet.copyGray,
                callback: () => copyToClipboard(contact.accountName),
              }}
            />
          </ItemWrapper>
        </form>
      </div>

      <DivFlex justifyContent="space-between" padding="24px">
        <Button size="full" variant="disabled" label={t('settings.contactForm.buttonCancel')} onClick={() => onClose(false)} />
        <Button size="full" variant="primary" label={t('settings.contactForm.buttonSave')} form="contact-form" disabled={!isValue} />
      </DivFlex>
    </PageConfirm>
  );
};

export default AddContact;
