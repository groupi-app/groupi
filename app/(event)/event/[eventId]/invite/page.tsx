"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useForm } from "react-hook-form";
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const formSchema = z.object({
    // expiresAt
    expiresAt: z.string(),
    // maxUses
    maxUses: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expiresAt: -1,
      maxUses: -1,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("%d uses expiring at %d", values.maxUses, values.expiresAt);
  }

  return (
    <div className="container max-w-5xl pt-12">
      <h1 className="font-heading font-medium text-4xl">Invites</h1>
      <div className="flex flex-col gap-2 py-4">
        <div className="border border-border shadow-md rounded-lg py-2 px-8">
          <div className="flex items-center justify-between h-full py-2">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-3xl">/invite/sdsfkjsdhfkj</h1>
              <div className="flex items-center ">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      className="text-muted-foreground"
                      size="icon"
                      variant="ghost"
                    >
                      <Icons.link />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy invite link</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      className="text-muted-foreground"
                      size="icon"
                      variant="ghost"
                    >
                      <Icons.qr />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show QR code</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div>
              <h2 className="font-heading text-2xl flex items-center gap-2">
                <span>Uses Left: </span>
                <Icons.infinity />
              </h2>
              <Progress value={(3 / 3) * 100} />
            </div>
            <div>
              <div className="font-heading text-2xl">
                <h2>Expires: </h2>
                <span className="text-muted-foreground text-xl">
                  12/30/2024 12:00AM
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage />
                <AvatarFallback>TS</AvatarFallback>
              </Avatar>
              <p className="text-muted-foreground">Created 01/01/2024</p>
            </div>
            <div className="flex items-center gap-2">
              <p>Used By:</p>
              <div className="flex items-center gap-1">
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback>TS</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback>TS</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback>TS</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create invite dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>Create invite</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[230px]">
          <DialogHeader>
            <DialogTitle>Create invite</DialogTitle>
          </DialogHeader>

          {/* Create invite form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Expires in */}
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  
                  <FormItem>
                    <FormLabel>Expires in</FormLabel>
                    <FormControl>
                      {/* <Input placeholder="5 days" {...field} /> */}
                      <Select
                        onValueChange={(value) => {
                          console.log(value);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Never" />
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
                          <SelectItem value={String(-1)}>
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
                name="expiresAt"
                render={({ field }) => (
                  
                  <FormItem>
                    <FormLabel>Max uses</FormLabel>
                    <FormControl>
                      {/* <Input placeholder="5 days" {...field} /> */}
                      <Select
                        onValueChange={(value) => {
                          console.log(value);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Never" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* value is time in ms */}
                          <SelectItem value={String(1)}>
                            1
                          </SelectItem>
                          <SelectItem value={String(5)}>
                            5
                          </SelectItem>
                          <SelectItem value={String(10)}>
                            10
                          </SelectItem>
                          <SelectItem value={String(20)}>
                            25
                          </SelectItem>
                          <SelectItem value={String(50)}>
                            50
                          </SelectItem>
                          <SelectItem value={String(100)}>
                            100
                          </SelectItem>
                          <SelectItem value={String(-1)}>
                            ∞
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit">Create invite</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


    </div>
  );
}
