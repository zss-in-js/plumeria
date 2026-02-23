import { LitePlayground } from 'component/LitePlayground';

export default function Page() {
  return (
    <div
      style={{
        height: 'calc(100dvh - 64px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LitePlayground />
    </div>
  );
}
