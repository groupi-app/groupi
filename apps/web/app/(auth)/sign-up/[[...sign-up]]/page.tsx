import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className='container py-24'>
      <div className='flex justify-center'>
        <SignUp />
      </div>
    </div>
  );
}
