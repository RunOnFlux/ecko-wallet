import { BaseTextInput } from 'src/baseComponent';
import { Content } from '../../style';
import { DivBodyNetwork } from './style';
import { useTranslation } from 'react-i18next';

type Props = {
  network: any;
};

const ViewNetwork = (props: Props) => {
  const { network } = props;
  const { t } = useTranslation();

  return (
    <Content>
      <DivBodyNetwork>
        <BaseTextInput
          inputProps={{
            value: network.name,
            readOnly: true,
          }}
          title={t('settings.networksPage.titleName')}
          height="auto"
        />
      </DivBodyNetwork>
      <DivBodyNetwork>
        <BaseTextInput
          inputProps={{
            readOnly: true,
            value: network.url,
          }}
          title={t('settings.networksPage.titleUrl')}
          height="auto"
        />
      </DivBodyNetwork>
      <DivBodyNetwork>
        <BaseTextInput
          inputProps={{
            readOnly: true,
            value: network.explorer,
          }}
          title={t('settings.networksPage.titleExplorer')}
          height="auto"
        />
      </DivBodyNetwork>
      <DivBodyNetwork>
        <BaseTextInput
          inputProps={{
            readOnly: true,
            value: network.networkId,
          }}
          title={t('settings.networksPage.titleNetworkId')}
          height="auto"
        />
      </DivBodyNetwork>
    </Content>
  );
};

export default ViewNetwork;
