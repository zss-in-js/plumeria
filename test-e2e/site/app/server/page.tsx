import { ServerComponent } from 'component/style-server-component';
import Link from 'next/link';

export default function Page() {
  return (
    <main>
      <ServerComponent />
      <Link href="/">Server Page</Link>
    </main>
  );
}
