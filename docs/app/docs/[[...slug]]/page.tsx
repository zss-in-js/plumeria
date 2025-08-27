import { source } from 'lib/source';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export async function generateMetadata(props: { params: Promise<{ slug?: Array<string> }> }): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  return generateSEOData({
    title: page?.data.title as string,
    subtitle: page?.data.description,
  });
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      // lastUpdate={new Date(page.data.lastModified || '')}
      editOnGithub={{
        owner: 'zss-in-js',
        repo: 'plumeria',
        sha: 'main',
        path: `website/content/docs/${page.file.path}`,
      }}
      tableOfContent={{
        style: 'normal',
        single: true,
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription hidden>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}
