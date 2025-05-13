/* eslint-disable no-console */
import { useHistory } from 'react-router-dom';
import Button from 'src/components/Buttons';
import { DivFlex, StickyFooter } from 'src/components';
import { NavigationHeader } from 'src/components/NavigationHeader';
import { Content, SettingBody } from '../style';
import { Body } from '../Contact/views/style';
import { useTranslation } from 'react-i18next';
import { LanguageSelect } from '@Components/LanguageSelector/select';

const LanguageSettings = () => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <SettingBody>
      <div style={{ padding: '0 24px' }}>
        <NavigationHeader title={t('settings.language')} onBack={() => history.push('/setting')} />
      </div>
      <Body>
        <Content>
          <LanguageSelect />
          <StickyFooter>
            <DivFlex gap="10px" style={{ width: '90%', maxWidth: 890 }}>
              <Button size="full" label={t('common.back')} onClick={() => history.push('/setting')} variant="primary" type="submit" />
            </DivFlex>
          </StickyFooter>
        </Content>
      </Body>
    </SettingBody>
  );
};

export default LanguageSettings;
