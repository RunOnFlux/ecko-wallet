import { CommonLabel, DivFlex } from 'src/components';
import { JsonView, defaultStyles, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import NftCard from '../NftCard';
import { NgTokenData } from './MarmaladeNGCollectionDetails';

export const NGModalContent = ({ token }: { token: NgTokenData }) => {
  const { theme } = useAppThemeContext();
  return (
    <DivFlex flexDirection="column" alignItems="center" padding="20px">
      <NftCard src={token.src} label={`#${token.number} `} cardStyle={{ width: 300, height: 300 }} />
      <CommonLabel>NFT Metadata</CommonLabel>
      <DivFlex
        padding="10px"
        style={{
          wordBreak: 'break-word',
          fontSize: 13,
        }}
      >
        <JsonView data={token.metadata} style={theme.isDark ? darkStyles : defaultStyles} />
      </DivFlex>
    </DivFlex>
  );
};
