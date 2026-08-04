import HomeContent from './components/home-content';
import { HomeRedirect } from './components/home-redirect';

export default function Home() {
  return (
    <>
      <HomeRedirect />
      <HomeContent />
    </>
  );
}
