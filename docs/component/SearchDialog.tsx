'use client';

import * as css from '@plumeria/core';
import { Fragment, useMemo, type ReactNode } from 'react';
import { useDocsSearch } from 'fumadocs-core/search/client';
import type { SortedResult } from 'fumadocs-core/search';
import {
  SearchDialog as Dialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search';
import type { SharedProps } from 'fumadocs-ui/contexts/search';

const styles = css.create({
  breadcrumbs: {
    display: 'flex',
    gap: 2,
    alignItems: 'center',
    fontSize: 12,
    color: 'var(--color-fd-muted-foreground)',
  },
  title: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    minWidth: 0,
    fontSize: 15,
    fontWeight: 500,
  },
  hash: {
    flexShrink: 0,
    color: 'var(--color-fd-muted-foreground)',
  },
  mark: {
    color: 'var(--color-fd-primary)',
    textDecoration: 'underline',
  },
  code: {
    fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.9em',
  },
});

const unescape = (text: string) => text.replace(/\\(.)/g, '$1');

const plainText = (content: string) => unescape(content.replace(/<\/?mark>/g, '').replace(/`/g, ''));

const renderMarks = (text: string): ReactNode[] =>
  text
    .split(/(<mark>.*?<\/mark>)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('<mark>') ? (
        <span key={index} classStyle={styles.mark}>
          {unescape(part.slice('<mark>'.length, -'</mark>'.length))}
        </span>
      ) : (
        <Fragment key={index}>{unescape(part)}</Fragment>
      ),
    );

const renderContent = (content: string): ReactNode[] =>
  content
    .split(/(`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('`') ? (
        <code key={index} classStyle={styles.code}>
          {renderMarks(part.slice(1, -1))}
        </code>
      ) : (
        <Fragment key={index}>{renderMarks(part)}</Fragment>
      ),
    );

const withPageBreadcrumbs = (items: SortedResult[]) => {
  let page: SortedResult | undefined;
  return items
    .filter((item) => item.type !== 'text')
    .map((item) => {
      if (item.type === 'page') {
        page = item;
        return item;
      }
      return {
        ...item,
        breadcrumbs: page ? [...(page.breadcrumbs ?? []), plainText(page.content as string)] : item.breadcrumbs,
      };
    });
};

const Chevron = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const Hash = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    classStyle={styles.hash}
  >
    <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
  </svg>
);

export const SearchDialog = (props: SharedProps) => {
  const { search, setSearch, query } = useDocsSearch({ type: 'static' });
  const items = useMemo(() => (query.data === 'empty' ? null : withPageBreadcrumbs(query.data ?? [])), [query.data]);

  return (
    <Dialog search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={items}
          Item={({ item, onClick }) =>
            item.type === 'action' ? (
              <SearchDialogListItem item={item} onClick={onClick} />
            ) : (
              <SearchDialogListItem item={item} onClick={onClick}>
                {item.breadcrumbs && item.breadcrumbs.length > 0 && (
                  <div classStyle={styles.breadcrumbs}>
                    {item.breadcrumbs.map((crumb, index) => (
                      <Fragment key={index}>
                        {index > 0 && <Chevron />}
                        {crumb}
                      </Fragment>
                    ))}
                  </div>
                )}
                <div classStyle={styles.title}>
                  {item.type === 'heading' && <Hash />}
                  <span>{typeof item.content === 'string' ? renderContent(item.content) : item.content}</span>
                </div>
              </SearchDialogListItem>
            )
          }
        />
      </SearchDialogContent>
    </Dialog>
  );
};
