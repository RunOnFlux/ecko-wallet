import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import images from 'src/images';
import Button from 'src/components/Buttons';
import { RoundedArrow } from 'src/components/Activities/FinishTransferItem';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { CommonLabel, DivFlex, StickyFooter } from 'src/components';
import IconNetwork from 'src/images/icon-network.svg?react';
import { NavigationHeader } from 'src/components/NavigationHeader';
import { ContactBody } from '../Contact/style';
import { ImageLock } from './style';
import { ImageNetworks, SettingBody } from '../style';
import { Body } from '../../SendTransactions/styles';
import EditNetwork from './views/EditNetwork';
import ViewNetwork from './views/ViewNetwork';
import { useAppSelector } from 'src/stores/hooks';

const networkDefault = {
  name: '',
  url: '',
  explorer: '',
  networkId: '',
};
const PageNetworks = () => {
  const history = useHistory();
  const { theme } = useAppThemeContext();
  const networks = useAppSelector((state) => state.extensions.networks);
  const [isEdit, setIsEdit] = useState(false);
  const [isNormal, setIsNormal] = useState(true);
  const [isView, setIsView] = useState(false);
  const [network, setNetwork] = useState<any>(networkDefault);

  const goBack = () => {
    if (isNormal) {
      history.push('/setting');
    } else {
      setIsNormal(true);
      setIsView(false);
      setIsEdit(false);
    }
  };
  const openMode = (isDefault, newNetwork) => {
    setNetwork({ ...newNetwork });
    if (isDefault) {
      setIsView(true);
      setIsEdit(false);
    } else {
      setIsView(false);
      setIsEdit(true);
    }
    setIsNormal(false);
  };
  const addNewNetwork = () => {
    setIsView(false);
    setIsEdit(true);
    setIsNormal(false);
    setNetwork(networkDefault);
  };
  const handleClickPopup = () => {
    setIsNormal(true);
    setIsView(false);
    setIsEdit(false);
  };

  const renderNormalMode = () =>
    networks.map((item) => (
      <DivFlex
        key={item.id}
        onClick={() => openMode(item.isDefault, item)}
        justifyContent="space-between"
        alignItems="center"
        padding="10px 24px"
        style={{ cursor: 'pointer' }}
      >
        <DivFlex alignItems="center" gap="5px">
          <RoundedArrow margin="0px 5px 0px 0px" color={theme.footer?.primary}>
            <IconNetwork />
          </RoundedArrow>
          <CommonLabel>{item.name}</CommonLabel>
        </DivFlex>
        <DivFlex>
          {item.isDefault && <ImageLock src={images.settings.iconLockMini} alt="lock" />}
          <ImageNetworks src={images.wallet.view} alt="view" />
        </DivFlex>
      </DivFlex>
    ));

  return (
    <SettingBody>
      <div style={{ padding: '0 24px' }}>
        <NavigationHeader title={isNormal ? 'Networks' : 'Network'} onBack={goBack} />
      </div>
      <Body>
        {isEdit && <EditNetwork network={network} onBack={goBack} isEdit onClickPopup={handleClickPopup} />}
        {isView && <ViewNetwork network={network} />}
        <ContactBody>{isNormal && renderNormalMode()}</ContactBody>
        {isNormal && (
          <StickyFooter>
            <Button size="full" label="Add New Network" onClick={addNewNetwork} style={{ width: '90%', maxWidth: 890 }} />
          </StickyFooter>
        )}
      </Body>
    </SettingBody>
  );
};
export default PageNetworks;
