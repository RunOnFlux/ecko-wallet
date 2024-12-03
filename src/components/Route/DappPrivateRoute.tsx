import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import styled from 'styled-components';
import { useSettingsContext } from 'src/contexts/SettingsContext';
import { useAppSelector } from 'src/stores/hooks';

const FetchingWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 1000;
`;
type Props = {
  component: any;
  path: string;
};
const DappPrivateRoute = (props: Props) => {
  const { component: Component, path } = props;
  const { isLocked } = useSettingsContext();
  const { isFetching, passwordHash } = useAppSelector((state) => state.extensions);
  const isLoggedIn = !isLocked;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFetching) {
      setLoading(false);
    }
  }, [isFetching]);
  if (loading) return <FetchingWrapper />;

  let RenderComponent = <Component />;
  if (!isLoggedIn || !passwordHash) {
    RenderComponent = <Redirect to={{ pathname: '/login-dapps', state: { from: path } }} />;
  }

  return <Route path={path} render={() => RenderComponent} />;
};

export default DappPrivateRoute;
