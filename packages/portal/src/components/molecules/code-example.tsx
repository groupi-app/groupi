'use client';
import { useState } from 'react';
export function CodeExample({ title, code }: { title: string; code: string }) {
  const [result, setResult] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setResult('Copied example');
    } catch {
      setResult('Copy unavailable. Select and copy the code below.');
    }
  }
  return (
    <div className='code-example'>
      <button
        type='button'
        aria-label={`Copy example: ${title}`}
        onClick={copy}
      >
        Copy code
      </button>
      {result ? (
        <span role='status' aria-label='Code copy result'>
          {result}
        </span>
      ) : null}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
