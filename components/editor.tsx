"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Tiptap } from "./tiptap";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";

interface PostData {
  title: string;
  content: string;
  id: string;
}

export function Editor({
  authorId,
  eventId,
  postData,
}: {
  authorId: string;
  eventId: string;
  postData?: PostData;
}) {
  const formSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    content: z.string().trim().min(1, "Content is required"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      title: postData?.title || "",
      content: postData?.content || "",
    },
  });
  const router = useRouter();
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await fetch("/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authorId: authorId,
        title: values.title,
        content: values.content,
        eventId: eventId,
      }),
    });
    console.log(res);
    router.push(`/event/${eventId}`);
  }

  return (
    <div>
      <Form {...form}>
        <form
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="text-4xl md:text-5xl font-heading border-none py-10 mb-2"
                    placeholder="Post Title"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Tiptap
                    placeholder="Type your post here."
                    content={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {postData ? (
            <Button
              className="w-full md:w-max flex items-center gap-1"
              type="submit"
            >
              <Icons.save className="w-4 h-4" />
              <span>Save</span>{" "}
            </Button>
          ) : (
            <Button
              className="w-full md:w-max flex items-center gap-1"
              type="submit"
            >
              <Icons.submit className="w-4 h-4" />
              <span>Submit</span>
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}
