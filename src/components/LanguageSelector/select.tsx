import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { BaseSelect } from 'src/baseComponent';
import styled from 'styled-components';
import { LANGUAGES_DATA } from '.';

export const languageOptions = Object.entries(LANGUAGES_DATA).map(([code, { flag, label }]) => ({
  value: code,
  label: `${flag} ${label}`,
}));

const Wrapper = styled.div`
  width: 100%;
`;

export const LanguageSelect: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { control } = useForm<{ language: string }>({
    defaultValues: { language: i18n.language },
  });

  return (
    <Wrapper>
      <Controller
        name="language"
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <BaseSelect
            placeholder={t('select_language')}
            selectProps={{
              value,
              onChange: (option) => {
                onChange(option);
                i18n.changeLanguage(option.value);
              },
            }}
            options={languageOptions}
            title={t('select_language')}
            height="auto"
          />
        )}
      />
    </Wrapper>
  );
};
