import { DropdownModal } from '@Components/DropdownModal';
import { useTranslation } from 'react-i18next';
import flags from 'emoji-flags';
import styled from 'styled-components';
import { CommonLabel, DivFlex, PrimaryLabel } from '..';
import { useModalContext } from 'src/contexts/ModalContext';

export const LANGUAGES_DATA = {
  en: {
    label: 'English',
    flag: flags.GB.emoji,
  },
  it: {
    label: 'Italiano',
    flag: flags.IT.emoji,
  },
};

const LanguageLabel = styled(CommonLabel)`
  cursor: pointer;
  font-size: 20px;
  display: flex;
  font-weight: 500;
  gap: 4px;
  margin-bottom: 20px;
`;

export const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const { closeModal } = useModalContext();
  i18n.language;

  const onSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    closeModal();
  };

  return (
    <DropdownModal
      title={
        <CommonLabel>
          {LANGUAGES_DATA[i18n.language]?.flag} {LANGUAGES_DATA[i18n.language]?.label}
        </CommonLabel>
      }
      iconContainerStyle={{ padding: 0 }}
      containerStyle={{ border: 'none', justifyContent: 'flex-end' }}
      modalTitle={t('select_language')}
      modalContent={
        <DivFlex flexDirection="column" padding="10px 20px" style={{ fontSize: 20 }}>
          <LanguageLabel onClick={() => onSelectLanguage('en')}>{flags.GB.emoji}&nbsp; English</LanguageLabel>
          <LanguageLabel onClick={() => onSelectLanguage('it')}>{flags.IT.emoji}&nbsp; Italiano</LanguageLabel>
        </DivFlex>
      }
    />
  );
};
