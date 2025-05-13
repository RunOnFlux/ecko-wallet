import { DropdownModal } from '@Components/DropdownModal';
import { useTranslation } from 'react-i18next';
import flags from 'emoji-flags';
import styled from 'styled-components';
import { CommonLabel, DivFlex } from '..';
import { useModalContext } from 'src/contexts/ModalContext';

export const LANGUAGES_DATA = {
  en: { label: 'English', flag: flags.GB.emoji },
  id: { label: 'Indonesian', flag: flags.ID.emoji },
  cs: { label: 'Czech', flag: flags.CZ.emoji },
  fil: { label: 'Filipino', flag: flags.PH.emoji },
  ru: { label: 'Russian', flag: flags.RU.emoji },
  de: { label: 'German', flag: flags.DE.emoji },
  fr: { label: 'French', flag: flags.FR.emoji },
  it: { label: 'Italiano', flag: flags.IT.emoji },
  bn: { label: 'Bengali', flag: flags.BD.emoji },
  hi: { label: 'Hindi', flag: flags.IN.emoji },
  hr: { label: 'Croatian', flag: flags.HR.emoji },
  el: { label: 'Greek', flag: flags.GR.emoji },
  ta: { label: 'Tamil', flag: flags.IN.emoji }, // Tamil → India
  fi: { label: 'Finnish', flag: flags.FI.emoji },
  hu: { label: 'Hungarian', flag: flags.HU.emoji },
  ja: { label: 'Japanese', flag: flags.JP.emoji },
  es: { label: 'Spanish', flag: flags.ES.emoji },
  vi: { label: 'Vietnamese', flag: flags.VN.emoji },
  zh: { label: 'Chinese (Simplified)', flag: flags.CN.emoji },
  zh_TW: { label: 'Chinese (Traditional)', flag: flags.TW.emoji },
  ko: { label: 'Korean', flag: flags.KR.emoji },
  bg: { label: 'Bulgarian', flag: flags.BG.emoji },
  sl: { label: 'Slovenian', flag: flags.SI.emoji },
  pt: { label: 'Portuguese', flag: flags.PT.emoji },
  uk: { label: 'Ukrainian', flag: flags.UA.emoji },
  ms: { label: 'Malay', flag: flags.MY.emoji },
  th: { label: 'Thai', flag: flags.TH.emoji },
  af: { label: 'Afrikaans', flag: flags.ZA.emoji },
  ca: { label: 'Catalan', flag: flags.ES.emoji }, // Catalan → Spain
  nl: { label: 'Dutch', flag: flags.NL.emoji },
  pl: { label: 'Polish', flag: flags.PL.emoji },
  ro: { label: 'Romanian', flag: flags.RO.emoji },
  sk: { label: 'Slovak', flag: flags.SK.emoji },
  no: { label: 'Norwegian', flag: flags.NO.emoji },
  sv: { label: 'Swedish', flag: flags.SE.emoji },
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
          {Object.keys(LANGUAGES_DATA).map((code) => (
            <LanguageLabel key={code} onClick={() => onSelectLanguage(code)}>
              {LANGUAGES_DATA[code].flag}&nbsp; {LANGUAGES_DATA[code].label}
            </LanguageLabel>
          ))}
        </DivFlex>
      }
    />
  );
};
