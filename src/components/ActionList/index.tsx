import React from 'react';
import { DivFlex, SecondaryLabel } from '..';

interface ActionProps {
  src?: any;
  label: React.ReactNode;
  onClick?: any;
  style?: React.CSSProperties;
}

export const ActionList = ({ actions }: { actions: ActionProps[] }) => (
  <>
    {actions.map((act, i) => (
      <DivFlex key={i} alignItems="center" style={{ cursor: 'pointer', padding: '5px 0px' }} onClick={act.onClick || null}>
        {act.src && <img src={act.src} style={{ marginRight: 13, ...act?.style }} />}
        <SecondaryLabel>{act.label}</SecondaryLabel>
      </DivFlex>
    ))}
  </>
);
