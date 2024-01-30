"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Page({
  error,
}: {
  error: Error & { message?: string };
}) {
  const router = useRouter();
  return (
    <div className="container mt-24">
      <h1 className="font-heading text-3xl mb-1">Uh Oh!</h1>
      <p className="mb-4">{error ? error.message : "Something went wrong!"}</p>
      <Button
        onClick={() => {
          router.back();
        }}
        variant={"outline"}
      >
        Go Back
      </Button>
    </div>
  );
}
