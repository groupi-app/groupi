import { siteConfig } from '@/config/site';

// Year computed at build time (static generation)
const year = new Date().getFullYear();

export function FooterCopyright() {
  return (
    <p className='text-sm'>
      &copy; {year} {siteConfig.name}
    </p>
  );
}
