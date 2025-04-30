import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import ModalCustom from 'src/components/Modal/ModalCustom';
import { hideLoading, showLoading } from 'src/stores/slices/extensions';
import { get } from 'lodash';
import { useCurrentWallet } from 'src/stores/slices/wallet/hooks';
import { setBalance } from 'src/stores/slices/wallet';
import Activities from 'src/components/Activities';
import { NavigationHeader } from 'src/components/NavigationHeader';
import { BodyFullScreen, PageFullScreen } from 'src/components/Page';
import { fetchLocal, getBalanceFromChainwebApiResponse } from '../../utils/chainweb';
import { useAppSelector } from 'src/stores/hooks';

const Header = styled.div`
  padding: 0 20px;
`;

const History = () => {
  const { t } = useTranslation();
  const { selectedNetwork } = useAppSelector((state) => state.extensions);
  const stateWallet = useCurrentWallet();
  const history = useHistory();

  const goBack = () => history.goBack();

  useEffect(() => {
    if (stateWallet) {
      const { account, chainId } = stateWallet;
      const pactCode = `(coin.details "${account}")`;
      showLoading();
      fetchLocal(pactCode, selectedNetwork?.url, selectedNetwork?.networkId, chainId)
        .then((res) => {
          if (get(res, 'result.status') === 'success') {
            setBalance(getBalanceFromChainwebApiResponse(res));
          }
          hideLoading();
        })
        .catch(() => {
          hideLoading();
        });
    }
  }, [stateWallet?.account, stateWallet?.chainId, selectedNetwork]);

  return (
    <PageFullScreen>
      <Header>
        <NavigationHeader title={t('history.header')} onBack={goBack} />
      </Header>
      <BodyFullScreen>
        <Activities />
      </BodyFullScreen>
      <ModalCustom isOpen={false} title={t('history.modal.confirmSendTransaction')} closeOnOverlayClick={false} />
    </PageFullScreen>
  );
};

export default History;
