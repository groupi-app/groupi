"use client";
import { Icons } from "@/components/icons";
import { useFormContext } from "@/components/providers/form-context-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const { formState, setFormState } = useFormContext();
  const router = useRouter();

  if (!formState.title) {
    router.push("/create");
    return null;
  }

  return (
    <div className="container max-w-4xl">
      <h2 className="font-heading text-4xl mt-10">I would like to...</h2>
      <div className="flex my-12 gap-4 justify-center flex-col md:flex-row items-center">
        <Link className="w-full max-w-md" href="/create/singleDate">
          <Button
            size="lg"
            variant="outline"
            className="py-12 text-xl w-full flex items-center justify-center gap-3"
          >
            <Icons.organizer className="w-16 h-16 min-w-[4rem]" />
            <span>Choose a date myself</span>
          </Button>
        </Link>
        <Link className="w-full max-w-md" href="/create/multiDate">
          <Button
            size="lg"
            variant="outline"
            className="py-12 text-xl w-full flex items-center justify-center gap-3"
          >
            <Icons.group
              color2="fill-muted-foreground"
              className="w-24 h-24 min-w-[4rem]"
            />
            <span>Poll Attendees</span>
          </Button>
        </Link>
      </div>
      <div className="flex justify-start">
        <Link href="/create">
          <Button className="flex items-center gap-1" variant={"secondary"}>
            <span>Back</span>
            <Icons.back className="text-sm" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
