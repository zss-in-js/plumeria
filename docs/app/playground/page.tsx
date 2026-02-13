import { Playground } from 'component/Playground';

export default function Page() {
  return (
    <div
      style={{
        height: 'calc(100vh - 64px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Playground />
    </div>
  );
}
