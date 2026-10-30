'use client';
import type { Page } from '../../content';
import { CodeExample } from '../molecules/code-example';
import { StatusBadge } from '../atoms/status-badge';
export function DocumentReader({ page }: { page: Page }) {
  return (
    <article className='document'>
      <p className='eyebrow'>
        {page.audience} / {page.version}
      </p>
      <h1 tabIndex={-1}>{page.title}</h1>
      <StatusBadge status={page.availability} />
      <div className='document-actions'>
        <a download href={`/exports/${page.id}.md`}>
          Download Markdown
        </a>
        <a download href={`/exports/${page.id}.txt`}>
          Download plain text
        </a>
      </div>
      {page.id === 'api-v1' || page.id === 'api-v2' ? (
        <a download href={`/exports/openapi-${page.version}.json`}>
          Download OpenAPI schema
        </a>
      ) : null}
      {page.id === 'exports' ? (
        <div className='document-actions'>
          <a download href='/llms.txt'>
            Download llms.txt
          </a>
          <a download href='/exports/search-index.json'>
            Download public search index
          </a>
          <a download href='/exports/corpus.json'>
            Download corpus and source hashes
          </a>
        </div>
      ) : null}
      <nav aria-label='On this page'>
        <ul>
          {page.passages.map(section => (
            <li key={section.id}>
              <a href={`${page.path}#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      {page.passages.map(section => (
        <section key={section.id} id={section.id} tabIndex={-1}>
          <h2>
            <a href={`${page.path}#${section.id}`}>{section.title}</a>
          </h2>
          <p>{section.text}</p>
          {section.references?.length ? (
            <ul>
              {section.references.map(reference => (
                <li key={reference.href}>
                  <a href={reference.href}>{reference.title}</a>
                </li>
              ))}
            </ul>
          ) : null}
          {section.code ? (
            <CodeExample title={section.title} code={section.code} />
          ) : null}
        </section>
      ))}
      <p className='source'>
        Source:{' '}
        <a
          href={`https://github.com/groupi-app/groupi/blob/main/${page.source}`}
        >
          {page.source}
        </a>
      </p>
    </article>
  );
}
