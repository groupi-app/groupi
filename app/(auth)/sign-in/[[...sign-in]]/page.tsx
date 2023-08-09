import { signInStyles } from "@/config/clerk";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="container py-24">
      <div className="flex justify-center">
        <SignIn />
      </div>
    </div>
  );
}
