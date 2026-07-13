import type { ReactNode } from 'react';
import { COLORS, FONT_FAMILY } from './theme';

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        background: COLORS.bgOuter,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          minHeight: '100vh',
          background: COLORS.bgApp,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
}
