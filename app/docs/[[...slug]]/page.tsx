import { source } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { getGithubLastEdit } from 'fumadocs-core/server';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  const time = await getGithubLastEdit({
    owner: 'fuma-nama',
    repo: 'fumadocs',
    path: `content/docs/${page.file.path}`,
  });

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      lastUpdate={new Date(time as Date)}
      editOnGithub={{
        owner: 'Refirst',
        repo: 'plumeria-docs',
        sha: 'main',
        path: `content/docs/${page.file.path}`,
      }}
      tableOfContent={{
        style: 'clerk',
        single: true,
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
