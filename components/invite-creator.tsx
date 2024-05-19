"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { createInvite, deleteInvite } from "@/lib/actions/invite";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteCreator({
  createdById,
  eventId,
}: {
//   params: { eventId: string };
  createdById: string;
  eventId: string
}) {
  const formSchema = z.object({
    expiresIn: z.number().nullable(),
    maxUses: z.number().nullable(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expiresIn: null,
      maxUses: null,
    },
  });

  const { toast } = useToast();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const expiresAt = values.expiresIn === null ? null : new Date(Date.now() + values.expiresIn)

    const res = await createInvite({
      eventId: eventId,
      createdById: createdById,
      expiresAt: expiresAt,
      maxUses: values.maxUses
    });
    if (res.success) {
      toast({title: "Invite Created", description: `Your invite has been successfully created. It has ${values.maxUses} uses and will expire on ${expiresAt}`})
    }
    
  }

  return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Expires in */}
              <FormField
                control={form.control}
                name="expiresIn"
                render={({ field }) => (
                  
                  <FormItem>
                    <FormLabel>Expires in</FormLabel>
                    <FormControl>
                      {/* <Input placeholder="5 days" {...field} /> */}
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === "never" ? null : Number(value));
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Never" {...field} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* value is time in ms */}
                          <SelectItem value={String(30 * 60 * 1000)}>
                            30 minutes
                          </SelectItem>
                          <SelectItem value={String(60 * 60 * 1000)}>
                            1 hour
                          </SelectItem>
                          <SelectItem value={String(6 * 60 * 60 * 1000)}>
                            6 hours
                          </SelectItem>
                          <SelectItem value={String(12 * 60 * 60 * 1000)}>
                            12 hours
                          </SelectItem>
                          <SelectItem value={String(24 * 60 * 60 * 1000)}>
                            1 day
                          </SelectItem>
                          <SelectItem value={String(7 * 24 * 60 * 60 * 1000)}>
                            7 days
                          </SelectItem>
                          <SelectItem value={String("never")}>
                            Never
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Max uses */}
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  
                  <FormItem>
                    <FormLabel>Max uses</FormLabel>
                    <FormControl>
                      {/* <Input placeholder="5 days" {...field} /> */}
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === "never" ? null : Number(value));
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="∞" {...field} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* value is time in ms */}
                          <SelectItem value={String(1)}>
                            1
                          </SelectItem>
                          <SelectItem value={String(5)}>5</SelectItem>
                          <SelectItem value={String(10)}>10</SelectItem>
                          <SelectItem value={String(25)}>25</SelectItem>
                          <SelectItem value={String(50)}>50</SelectItem>
                          <SelectItem value={String(100)}>100</SelectItem>
                          <SelectItem value={String("inf")}>∞</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit">Create invite</Button>
            </form>
          </Form>
  );
}
