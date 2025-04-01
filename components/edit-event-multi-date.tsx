"use client";
import { Calendar } from "@/components/ui/calendar";
import { updateEventPotentialDateTimes } from "@/lib/actions/event";
import { merge } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "./ui/use-toast";

interface Form1Types {
  dates: Date[];
  time: string;
}

interface Form2Types {
  dateTimes: Date[];
}

const form1Schema = z.object({
  dates: z
    .array(z.date())
    .min(1, { message: "At least one date is required." }),
  time: z.string().regex(new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")),
});

const form2Schema = z.object({
  dateTimes: z
    .array(z.date())
    .min(2, { message: "At least two dates are required." }),
});

export function EditEventMultiDate({
  eventId,
  dates,
}: {
  eventId: string;
  dates: Date[] | undefined;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const form1 = useForm<Form1Types>({
    resolver: zodResolver(form1Schema),
    defaultValues: {
      dates: [new Date()],
      time: new Date().toLocaleTimeString([], {
        timeStyle: "short",
        hour12: false,
      }),
    },
  });

  const form2 = useForm<Form2Types>({
    resolver: zodResolver(form2Schema),
    defaultValues: {
      dateTimes: dates ?? [],
    },
  });

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? "-" : "+"
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  async function onSubmit1(data: z.infer<typeof form1Schema>) {
    const dates = data.dates;
    const localTime = data.time + ":00";

    const dateTimes = dates.map(
      (date) => new Date(`${date.toISOString().split("T")[0]}T${localTime}`)
    );

    form2.setValue(
      "dateTimes",
      merge(
        form2.getValues("dateTimes"),
        dateTimes,
        (a, b) => a.getTime() === b.getTime()
      )
    );
  }

  async function onSubmit2(data: z.infer<typeof form2Schema>) {
    setIsSaving(true);

    const res = await updateEventPotentialDateTimes({
      eventId,
      potentialDateTimes: data.dateTimes.map((date) => date.toISOString()),
    });
    if (res.error) {
      toast({
        title: "Error",
        description: "The event was unable to be updated.",
      });
      setIsSaving(false);
    }
    if (res.success) {
      toast({
        title: "Date/time poll created",
        description: "A new date/time poll has been created.",
      });
      router.push(`/event/${res.success.id}`);
    }
  }

  return (
    <div className="my-8 flex flex-col gap-6">
      <div className="flex items-center md:items-start gap-5 md:gap-0 flex-col md:flex-row md:justify-evenly">
        <Form {...form1}>
          <form onSubmit={form1.handleSubmit(onSubmit1)}>
            <div className="flex flex-col gap-4">
              <FormField
                control={form1.control}
                name="dates"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Calendar
                        mode="multiple"
                        className="rounded-md border border-border w-max mx-auto"
                        selected={field.value}
                        onSelect={(dates) =>
                          dates ? form1.setValue("dates", dates) : null
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-center">
                <FormField
                  control={form1.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="time"
                          className="w-max mx-auto cursor-text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <span className="text-muted-foreground text-xs text-center">
                  {getTimezoneString()}
                </span>
              </div>
              <Button
                disabled={form1.watch("dates").length < 1}
                className="flex items-center gap-1 max-w-sm w-full mx-auto"
                type="submit"
              >
                <Icons.plus className="size-5" />
                <span>Add {form1.watch("dates").length} Options</span>
              </Button>
            </div>
          </form>
        </Form>
        <Form {...form2}>
          <form id="form2" onSubmit={form2.handleSubmit(onSubmit2)}>
            <div>
              <ScrollArea className="h-80 w-72 rounded-md border border-border">
                <div className="p-4 divide-y">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className=" font-heading leading-none">Options</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center gap-1 text-xs hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => form2.setValue("dateTimes", [])}
                    >
                      <Icons.delete className="size-4" /> <span>Clear</span>
                    </Button>
                  </div>
                  {form2
                    .watch("dateTimes")
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date, i) => (
                      <div
                        className="py-1 flex items-center justify-between"
                        key={i}
                      >
                        <div>
                          {date.toLocaleString([], {
                            weekday: "short",
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          })}
                        </div>
                        <Button
                          onClick={() => {
                            form2.setValue(
                              "dateTimes",
                              form2
                                .watch("dateTimes")
                                .filter((_, index) => index !== i)
                            );
                          }}
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Icons.close className="size-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </form>
        </Form>
      </div>
      <div className="flex justify-between">
        <Link href={`/event/${eventId}/change-date`}>
          <Button className="flex items-center gap-1" variant={"secondary"}>
            <span>Back</span>
            <Icons.back className="text-sm" />
          </Button>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={form2.watch("dateTimes").length < 2}
              data-test="new-event-single-submit"
              className="flex items-center gap-1"
              type="button"
            >
              Submit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run New Date/Time Poll?</DialogTitle>
              <DialogDescription>
                Are you sure you want to start a new date/time poll? This will
                override any existing polls.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                className="flex items-center gap-1"
                type="submit"
                form="form2"
                disabled={isSaving || form2.watch("dateTimes").length < 2}
              >
                {isSaving ? (
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                ) : (
                  <></>
                )}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
