"use client";
import { Icons } from "@/components/icons";
import { useFormContext } from "@/components/providers/form-context-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const { formState, setFormState } = useFormContext();

  return (
    <div className="container max-w-4xl">
      <h2 className="font-heading text-4xl">I would like to...</h2>
      <div className="flex my-8 gap-4">
        <Link href="/create/singleDate">
          <Button size="lg" variant="outline" className="p-6">
            Choose a date myself
          </Button>
        </Link>
        <Link href="/create/multiDate">
          <Button size="lg" variant="outline" className="p-6">
            Poll Attendees
          </Button>
        </Link>
      </div>
      <div className="flex justify-start">
        <Link href="/create/info">
          <Button className="flex items-center gap-1" variant={"secondary"}>
            <span>Back</span>
            <Icons.back className="text-sm" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
