import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { disable2FA } from 'src/stores/slices/auth';
import { CommonLabel } from 'src/components';
import Button from 'src/components/Buttons';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Toast from 'src/components/Toast/Toast';
import { useAppDispatch } from 'src/stores/hooks';
import { Body, Footer, Page } from 'src/components/Page';
import { useTranslation } from 'react-i18next';

const TOTPDisabler = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const goBack = () => {
    history.goBack();
  };

  const handleDisable = () => {
    if (isLoading) return;
    setIsLoading(true);

    dispatch(disable2FA());
    goBack();
    toast.success(<Toast type="success" content={t('settings.2faPage.successDisable')} />);
  };

  return (
    <Page>
      <NavigationHeader title={t('settings.2faPage.title')} onBack={goBack} />
      <Body>
        <CommonLabel fontSize={18}>{t('settings.2faPage.description')}</CommonLabel>
      </Body>
      <Footer>
        <Button onClick={handleDisable} isDisabled={isLoading} label={t('settings.2faPage.disableButton')} size="full" variant="primary" />
      </Footer>
    </Page>
  );
};

export default TOTPDisabler;
