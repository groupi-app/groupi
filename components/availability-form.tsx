"use client";
import { PotentialDateTimeWithAvailabilities } from "@/types";
import { AvailabilityCard } from "./availability-card";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { updateMembershipAvailabilities } from "@/lib/actions/availability";
import { useToast } from "./ui/use-toast";
import { useRouter } from "next/navigation";

export function AvailabilityForm({
  potentialDateTimes,
}: {
  potentialDateTimes: PotentialDateTimeWithAvailabilities[];
}) {
  const eventId = potentialDateTimes[0].eventId;
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = z.object({
    formAnswers: z.array(
      z.object({
        potentialDateTimeId: z.string(),
        answer: z.enum(["yes", "maybe", "no"], {
          message: "Please select a response for each option",
        }),
      })
    ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formAnswers: potentialDateTimes.map((pdt) => ({
        potentialDateTimeId: pdt.id,
        answer: undefined,
      })),
    },
  });

  function setFormAnswers(answer: "yes" | "maybe" | "no") {
    form.setValue(
      "formAnswers",
      form.getValues().formAnswers.map((a) => ({ ...a, answer }))
    );
  }

  function setFormAnswer(index: number, value: any) {
    let availabilities = form.getValues().formAnswers;
    availabilities[index] = value;
    form.setValue(`formAnswers`, availabilities);
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const availabilityUpdates = data.formAnswers.map((answer) => ({
      potentialDateTimeId: answer.potentialDateTimeId,
      status: answer.answer.toUpperCase() as "YES" | "MAYBE" | "NO",
    }));

    const res = await updateMembershipAvailabilities(
      eventId,
      availabilityUpdates
    );

    if (res.error) {
      toast({
        title: "Unable to update",
        description:
          "There was an error updating your availability. Please try again.",
      });
      setIsLoading(false);
      router.refresh();
    }

    if (res.success) {
      toast({
        title: "Availability Updated",
        description: "Your availability has been successfully updated.",
      });
      setIsLoading(false);
      router.push(`/event/${eventId}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center gap-2 my-2">
          <Button
            type="button"
            onClick={() => setFormAnswers("yes")}
            className="text-muted-foreground px-3"
            variant="outline"
          >
            <div className="flex items-center gap-1">
              <Icons.check className="w-5 h-5" />
              <span>All Yes</span>
            </div>
          </Button>
          <Button
            type="button"
            onClick={() => setFormAnswers("maybe")}
            className="text-muted-foreground px-3"
            variant="outline"
          >
            <div className="flex items-center gap-1">
              <span className="font-semibold text-lg">?</span>
              <span>All Maybe</span>
            </div>
          </Button>
          <Button
            type="button"
            onClick={() => setFormAnswers("no")}
            className="text-muted-foreground px-3"
            variant="outline"
          >
            <div className="flex items-center gap-1">
              <Icons.close className="w-5 h-5" />
              <span>All No</span>
            </div>
          </Button>
        </div>
        <FormField
          control={form.control}
          name="formAnswers"
          render={() => (
            <FormItem>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {potentialDateTimes.map((pdt, i) => (
                    <AvailabilityCard
                      key={pdt.id}
                      pdt={pdt}
                      formAnswers={form.watch("formAnswers")}
                      setFormAnswer={setFormAnswer}
                      index={i}
                    />
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={
            !(
              form.watch("formAnswers").filter((a) => a.answer).length ===
              form.watch("formAnswers").length
            )
          }
          className="my-2"
        >
          Submit
        </Button>
      </form>
    </Form>
  );
}
