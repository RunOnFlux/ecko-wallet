import { useState } from 'react';
import { useAppSelector } from 'src/stores/hooks';
import { getSelectedNetwork } from 'src/stores/slices/extensions';
import PopupDetailTransaction from 'src/pages/Wallet/views/PopupDetailTransaction';
import { LocalActivity } from './types';
import ActivitiyList from './List';

const Activities = () => {
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
          isOpen={selectedActivity !== null}
          title="Transaction Details"
          onCloseModal={() => setSelectedActivity(null)}
        />
      )}
    </>
  );
};

export default Activities;
