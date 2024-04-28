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
      expiresAt: "",
      maxUses: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    return;
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <SelectValue placeholder="Expires in" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(30 * 60 * 1000)}>
                        30 minutes
                      </SelectItem>
                      <SelectItem value={new Date(0, 0, 0, 1).toISOString()}>
                        60 minutes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
