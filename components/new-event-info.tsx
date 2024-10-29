"use client";

import {
  Form,
  FormItem,
  FormField,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LocationInput } from "./location-input";
import { Button } from "./ui/button";
import { Icons } from "./icons";
import { useFormContext } from "./providers/form-context-provider";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Event Title is required",
  }),
  description: z
    .string()
    .max(1000, { message: "Description must be less than 1000 characters." })
    .optional(),
  location: z
    .string()
    .max(200, { message: "Location must be less than 200 characters." })
    .optional(),
});

export default function NewEventInfo() {
  const router = useRouter();
  const { formState, setFormState } = useFormContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: formState.title,
      description: formState.description,
      location: formState.location,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setFormState(data);
    router.push("/create/dateType");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="gap-6 flex flex-col">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Title<span className="text-muted-foreground">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    data-test="new-event-title"
                    placeholder="Groupi Party!"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The title of your event. (required)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    data-test="new-event-description"
                    placeholder="Join us for food and festivities..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description of your event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <LocationInput dataTest="new-event-location" field={field} />
                </FormControl>
                <FormDescription>
                  The location where your event is taking place.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              data-test="new-event-next-button"
              className="flex items-center gap-1"
              variant={"secondary"}
              type="submit"
            >
              <span>Next</span>
              <Icons.forward className="text-sm" />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
