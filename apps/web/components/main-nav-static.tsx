import { Icons } from '@/components/icons';
import { siteConfig } from '@/config/site';
import Link from 'next/link';
import { ReactNode } from 'react';

interface MainNavStaticProps {
  dynamicContent: ReactNode;
}

/**
 * Static navigation shell - renders immediately
 * Only the logo and site name, no session data needed
 */
export function MainNavStatic({ dynamicContent }: MainNavStaticProps) {
  return (
    <div className='container flex items-center justify-between h-20 py-6'>
      <div className='flex md:gap-10 w-full'>
        <Link href='/' className='items-center hidden space-x-2 md:flex'>
          <Icons.logo width='26' height='23' viewBox='0 0 197 225' />
          <span className='hidden text-xl font-bold font-heading sm:inline-block'>
            {siteConfig.name}
          </span>
        </Link>
        {dynamicContent}
      </div>
    </div>
  );
}
