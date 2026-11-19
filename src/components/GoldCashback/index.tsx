import styled from 'styled-components';
import type { GoldCashbackEmbed } from 'src/utils/bring';

// Bring's block fills whatever width it gets (popup or full tab) and needs at least 353px of height.
const BLOCK_HEIGHT = 353;

const Wrapper = styled.div`
  width: 100%;
  flex-shrink: 0;
`;

// No sandbox attribute: the block needs scripts and same-origin, and the kit runs inside it
// (bringContent.js has all_frames: true). Scrolling stays on so zoomed content isn't cut off.
const Frame = styled.iframe`
  display: block;
  width: 100%;
  height: ${BLOCK_HEIGHT}px;
  border: 0;
`;

const Placeholder = styled.div`
  width: 100%;
  height: ${BLOCK_HEIGHT}px;
`;

// Matches Bring's Divider.png (1px, #404A8D), full width under the block.
const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #404a8d;
`;

/**
 * Bring's embedded Gold Cashback block, shown full width at the top of the opening screen, with a divider
 * under it. Its "Go to Rewards" button is handled by the kit. Reserves its space while the URL loads and
 * renders nothing if the block is unavailable.
 */
const GoldCashbackBlock = ({ embed }: { embed: GoldCashbackEmbed }) => {
  if (embed.status === 'unavailable') return null;
  return (
    <Wrapper>
      {embed.status === 'ready' ? <Frame title="Gold Cashback" src={embed.url} /> : <Placeholder aria-hidden />}
      <Divider />
    </Wrapper>
  );
};

export default GoldCashbackBlock;
