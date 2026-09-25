import { source } from 'lib/source';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';
import { MarkdownActions } from 'component/MarkdownActions';
import type { Node } from 'fumadocs-core/page-tree';

const getSection = (nodes: Node[], url: string, section = ''): string | undefined => {
  let current = section;
  for (const node of nodes) {
    if (node.type === 'separator') current = typeof node.name === 'string' ? node.name : section;
    if (node.type === 'page' && node.url === url) return current;
    if (node.type === 'folder') {
      if (node.index?.url === url) return current;
      const found = getSection(node.children, url, current);
      if (found !== undefined) return found;
    }
  }
};

export async function generateMetadata(props: { params: Promise<{ slug?: Array<string> }> }): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  return generateSEOData({
    title: page?.data.title as string,
    subtitle: page?.data.description,
    path: page?.url,
  });
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const section = getSection(source.pageTree.children, page.url);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      editOnGithub={{
        owner: 'zss-in-js',
        repo: 'plumeria',
        sha: 'main',
        path: `docs/content/docs/${page.path}`,
      }}
      tableOfContent={{
        style: 'normal',
        single: true,
      }}
    >
      <header className="docs-article-header">
        {section && <p className="docs-article-section">{section}</p>}
        <div className="docs-article-title-row">
          <DocsTitle>{page.data.title}</DocsTitle>
          <MarkdownActions markdownUrl={`${page.url}.md`} />
        </div>
        {page.data.description && (
          <DocsDescription className="docs-article-description">{page.data.description}</DocsDescription>
        )}
      </header>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}
