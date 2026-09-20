import { redirect } from 'next/navigation';
import { latestBlogUrl } from 'lib/source';

export default function Page(): never {
  redirect(latestBlogUrl);
}
