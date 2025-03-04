"use client";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "./ui/input";
import Link from "next/link";
import { Button } from "./ui/button";
import { Icons } from "./icons";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { z } from "zod";
import { set, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl, FormMessage } from "./ui/form";
import { updateEventDateTime } from "@/lib/actions/event";
import { useState } from "react";
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

const formSchema = z.object({
  date: z.date(),
  time: z.string().regex(new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")),
});

export function EditEventSingleDate({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      time: new Date().toLocaleTimeString([], {
        timeStyle: "short",
        hour12: false,
      }),
    },
  });

  const getDateTime = () => {
    return new Date(
      `${form.watch("date").toISOString().split("T")[0]}T${form.watch("time")}`
    );
  };

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? "-" : "+"
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("TEST");
    setIsSaving(true);
    const date = data.date;
    const localTime = data.time + ":00";

    const dateTime = new Date(
      `${date.toISOString().split("T")[0]}T${localTime}`
    ).toISOString();

    const res = await updateEventDateTime({ eventId, dateTime });
    if (res.error) {
      toast({
        title: "Error",
        description: "The date/time was unable to be updated.",
      });
      setIsSaving(false);
    }
    if (res.success) {
      toast({
        title: "Date/time Updated",
        description: "The date/time has been updated.",
      });
      setIsSaving(false);
      router.push(`/event/${res.success.id}`);
    }
    setIsSaving(false);
  }

  return (
    <Form {...form}>
      <form id="edit-date-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="my-8 flex flex-col gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Calendar
                    mode="single"
                    className="rounded-md border border-border w-max mx-auto"
                    selected={field.value}
                    onSelect={(date) =>
                      date ? form.setValue("date", date) : null
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
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      data-test="new-event-single-time"
                      type="time"
                      className="w-max mx-auto cursor-text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="text-muted-foreground text-sm text-center">
              {getTimezoneString()}
            </span>
          </div>
          <div className="mx-auto">
            <div className="flex items-center rounded-lg bg-muted p-4 max-w-sm w-max mx-auto">
              <h2 className="text-xl font-semibold">
                {getDateTime().toLocaleString([], {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })}
              </h2>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <Link href={`/event/${eventId}/change-date`}>
              <Button className="flex items-center gap-1" variant={"secondary"}>
                <span>Back</span>
                <Icons.back className="text-sm" />
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  data-test="new-event-single-submit"
                  className="flex items-center gap-1"
                  type="button"
                >
                  Submit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Date/Time</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to update the date/time? This will
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
                    form="edit-date-form"
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
      </form>
    </Form>
  );
}
