import React from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import ContactsIcon from 'src/images/settings-contacts.svg?react';
import NetworksIcon from 'src/images/settings-networks.svg?react';
import ThemeIcon from 'src/images/icon-theme.svg?react';
import KeyIcon from 'src/images/settings-export-key.svg?react';
import DiscordIcon from 'src/images/discord-icon.svg?react';
import GlobeIcon from 'src/images/globe-icon.svg?react';
import Padlock from 'src/images/padlock.svg?react';
import ExpandView from 'src/images/expand-view.svg?react';
import { CommonLabel, DivFlex, SecondaryLabel } from 'src/components';
import { DISCORD_INVITATION_LINK, PRIVACY_LINK, TERM_LINK, WEBSITE_LINK } from 'src/utils/config';
import { useSettingsContext } from 'src/contexts/SettingsContext';
import useSessionStorage from 'src/hooks/useSessionStorage';
import { STORAGE_PASSWORD_KEY } from 'src/utils/storage';
import { RoundedArrow } from '../../components/Activities/FinishTransferItem';
import packageJson from '../../../package.json';
import { useAppSelector } from 'src/stores/hooks';

const SettingsContainer = styled.div`
  padding: 24px;
  margin-bottom: 60px;
  .settingMenu {
    border-top: 1px solid #d3d3d3;
  }
  .settingMenu:first-child {
    border-top: none;
  }
`;

const SettingMenu = styled(DivFlex)`
  cursor: pointer;
  svg {
    circle {
      fill: ${({ theme }) => theme.iconSettingsBackground};
    }
  }
`;

const AboutDiv = styled(DivFlex)`
  a {
    text-decoration: none;
    display: flex;
    align-items: center;
    svg {
      margin-right: 6px;
    }
  }
`;

const PageSetting = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { setIsLocked } = useSettingsContext();
  const { secretKey } = useAppSelector((state) => state.wallet);
  const { theme } = useAppThemeContext();
  const [, , , removeAccountPassword] = useSessionStorage(STORAGE_PASSWORD_KEY, null);

  const lockWallet = () => {
    removeAccountPassword();
    setIsLocked(true);
  };

  const settingsMenu = [
    { title: t('settings.contacts'), img: <ContactsIcon />, description: t('settings.contactsDesc'), onClick: () => history.push('/contact') },
    { title: t('settings.networks'), img: <NetworksIcon />, description: t('settings.networksDesc'), onClick: () => history.push('/networks') },
    {
      title: t('settings.connectedSites'),
      img: <NetworksIcon />,
      description: t('settings.connectedSitesDesc'),
      onClick: () => history.push('/connected-sites'),
    },
    {
      title: t('settings.walletConnect'),
      img: <NetworksIcon />,
      description: t('settings.walletConnectDesc'),
      onClick: () => history.push('/wallet-connect'),
    },
    {
      title: t('settings.txSettings'),
      img: <NetworksIcon />,
      description: t('settings.txSettingsDesc'),
      onClick: () => history.push('/tx-settings'),
    },
    {
      title: t('settings.exportPhrase'),
      img: <KeyIcon />,
      description: t('settings.exportPhraseDesc'),
      onClick: () => history.push('/export-seed-phrase'),
      isHidden: secretKey?.length !== 256,
    },
    {
      title: t('settings.editPassword'),
      img: <KeyIcon />,
      description: t('settings.editPasswordDesc'),
      onClick: () => history.push('/edit-password'),
    },
    { title: t('settings.2fa'), img: <KeyIcon />, description: t('settings.2faDesc'), onClick: () => history.push('/2fa') },
    {
      title: t('settings.expandView'),
      img: <ExpandView />,
      description: t('settings.expandViewDesc'),
      onClick: () => window?.chrome?.tabs?.create({ url: '/index.html#/' }),
    },
    {
      title: t('settings.theme'),
      img: (
        <RoundedArrow margin="0px 5px 0px 0px" background={theme.iconSettingsBackground}>
          <ThemeIcon style={{ width: 20 }} />
        </RoundedArrow>
      ),
      description: t('settings.themeDesc'),
      onClick: () => history.push('/select-theme'),
    },
    { title: t('settings.lock'), img: <Padlock />, description: t('settings.lockDesc'), onClick: lockWallet },
    {
      title: t('settings.lockSettings'),
      img: <Padlock />,
      description: t('settings.lockSettingsDesc'),
      onClick: () => history.push('/lock-settings'),
    },
  ];

  const getSettingsItem = ({ img, title, description, onClick }) => (
    <SettingMenu key={title} className="settingMenu" justifyContent="flex-start" gap="10px" padding="15px 0" onClick={onClick}>
      {img}
      <DivFlex flexDirection="column" justifyContent="flex-start">
        <CommonLabel fontWeight={600} fontSize={16}>
          {title}
        </CommonLabel>
        <SecondaryLabel fontWeight={500} fontSize={12}>
          {description}
        </SecondaryLabel>
      </DivFlex>
    </SettingMenu>
  );

  return (
    <SettingsContainer>
      {settingsMenu.map((item) => !item.isHidden && getSettingsItem(item))}
      <AboutDiv marginTop="48px" alignItems="center">
        <SecondaryLabel fontWeight={500}>
          eckoWALLET V. {packageJson.version}
          <br />
          <br />
          The Kadena ecosystem gateway
        </SecondaryLabel>
      </AboutDiv>
      <AboutDiv marginTop="30px">
        <a href={DISCORD_INVITATION_LINK} target="_blank" rel="noreferrer">
          <DiscordIcon /> <SecondaryLabel>{t('settings.discord')}</SecondaryLabel>
        </a>
      </AboutDiv>
      <AboutDiv marginTop="10px">
        <a href={WEBSITE_LINK} target="_blank" rel="noreferrer">
          <GlobeIcon /> <SecondaryLabel>{t('settings.website')}</SecondaryLabel>
        </a>
      </AboutDiv>
      <AboutDiv marginTop="10px">
        <a href={TERM_LINK} target="_blank" rel="noreferrer">
          <SecondaryLabel>{t('settings.terms')}</SecondaryLabel>
        </a>
      </AboutDiv>
      <AboutDiv marginTop="10px">
        <a href={PRIVACY_LINK} target="_blank" rel="noreferrer">
          <SecondaryLabel>{t('settings.privacy')}</SecondaryLabel>
        </a>
      </AboutDiv>
    </SettingsContainer>
  );
};

export default PageSetting;
