import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from 'src/stores/hooks';
import { getSelectedNetwork } from 'src/stores/slices/extensions';
import PopupDetailTransaction from 'src/pages/Wallet/views/PopupDetailTransaction';
import { LocalActivity } from './types';
import ActivitiyList from './List';

const Activities = () => {
  const { t } = useTranslation();
  const [pendingCrossChainRequestKeys] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<LocalActivity | null>(null);

  const selectedNetwork = useAppSelector(getSelectedNetwork);

  return (
    <>
      <ActivitiyList openActivityDetail={setSelectedActivity} />
      {selectedActivity && (
        <PopupDetailTransaction
          isFinishing={pendingCrossChainRequestKeys.includes(selectedActivity.requestKey)}
          selectedNetwork={selectedNetwork}
          activityDetails={selectedActivity}
          isOpen={true}
          title={t('activities.detailsTitle')}
          onCloseModal={() => setSelectedActivity(null)}
        />
      )}
    </>
  );
};

export default Activities;
