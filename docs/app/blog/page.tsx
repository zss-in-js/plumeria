import { redirect } from 'next/navigation';
import { latestBlogUrl } from 'lib/latestBlogUrl';

export default function Page(): never {
  redirect(latestBlogUrl);
}
