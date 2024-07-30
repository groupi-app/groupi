"use client";

import { z } from "zod";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { set, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "./ui/use-toast";
import { createInvite } from "@/lib/actions/invite";
import { auth } from "@clerk/nextjs";
import { DialogClose } from "@radix-ui/react-dialog";
import { useState } from "react";

export function AddInvite({ eventId }: { eventId: string }) {
  const formSchema = z.object({
    name: z
      .string()
      .max(64, { message: "Invite name must be less than 65 characters." }),
    expiresIn: z.number().nullable(),
    maxUses: z
      .number()
      .min(1, { message: "Max uses must be positive integer" })
      .max(999999, {
        message: "Max uses must be less than 1,000,000 (if not unlimited)",
      })
      .nullable(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      expiresIn: null,
      maxUses: null,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { toast } = useToast();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const expiresAt =
      values.expiresIn === null
        ? null
        : new Date(Date.now() + values.expiresIn);

    const res = await createInvite({
      name: values.name,
      eventId: eventId,
      expiresAt: expiresAt,
      maxUses: values.maxUses,
    });
    if (res.success) {
      toast({
        title: "Invite Created",
        description: "The invite has been successfully created.",
      });
      setIsOpen(false);
    } else if (res.error) {
      toast({
        title: "Error",
        description: "Unable to create invite.",
      });
    }
    setIsLoading(false);
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button className="flex items-center gap-1">
          <Icons.plus className="w-4 h-4" />
          <span>New Invite</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Invite</DialogTitle>
          <DialogDescription>Add an invite to this event.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Invite name" {...field} />
                  </FormControl>
                  <span className="text-muted-foreground text-sm ml-1">
                    optional
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        field.onChange(
                          value === "never" ? null : Number(value)
                        );
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
                        <SelectItem value={String("never")}>Never</SelectItem>
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
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          field.onChange(null);
                        } else {
                          field.onChange(Number(e.target.value));
                        }
                      }}
                      min={1}
                    />
                  </FormControl>
                  <FormMessage />
                  <span className="text-muted-foreground text-sm ml-1">
                    leave blank for unlimited
                  </span>
                </FormItem>
              )}
            />
            <DialogFooter>
              <div className="flex items-center gap-2 justify-end">
                <DialogClose asChild>
                  <Button variant="ghost" className="flex items-center gap-1">
                    <span>Cancel</span>
                  </Button>
                </DialogClose>
                <Button className="flex items-center gap-1" type="submit">
                  {isLoading ? (
                    <Icons.spinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icons.plus className="w-4 h-4" />
                  )}

                  <span>Add</span>
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
