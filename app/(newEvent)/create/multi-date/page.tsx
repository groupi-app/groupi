import { NewEventMultiDate } from '@/components/new-event-multi-date';

export default function Page() {
  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time Options</h1>
      <NewEventMultiDate />
    </div>
  );
}
