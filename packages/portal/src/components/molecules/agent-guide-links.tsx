'use client';
import { useState } from 'react';

export function AgentGuideLinks() {
  const [message, setMessage] = useState('');
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(
        new URL('/agents.md', window.location.origin).href
      );
      setMessage('Copied Markdown URL');
    } catch {
      setMessage('Could not copy. Open View Markdown and copy its address.');
    }
  }
  return (
    <aside aria-label='Build with an agent' className='document-actions'>
      <a href='/agents.md'>View Markdown for agents</a>
      <button type='button' onClick={copyUrl}>
        Copy Markdown URL
      </button>
      <span role='status' aria-label='Markdown URL copy result'>
        {message}
      </span>
    </aside>
  );
}
