"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Tiptap } from "./tiptap";
import { useRouter } from "next/navigation";

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  const formSchema = z.object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(100, "Your title is too long!"),
    content: z
      .string()
      .trim()
      .min(1, "Post body is required")
      .max(2000, "Your post is too long!"),
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
    setIsSaving(true);

    if (!postData) {
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
      if (res.ok) {
        toast({
          title: "Post Created",
          description: "Your post has been successfully created.",
        });
      }
      setIsSaving(false);
      router.push(`/event/${eventId}`);
    } else {
      const res = await fetch(`/api/post/${postData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
        }),
      });
      if (res.ok) {
        toast({
          title: "Post Updated",
          description: "Your post has been successfully updated.",
        });
      }
      setIsSaving(false);
      router.push(`/post/${postData.id}`);
    }
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
              {isSaving ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.save className="w-4 h-4" />
              )}
              <span>Save</span>{" "}
            </Button>
          ) : (
            <Button
              className="w-full md:w-max flex items-center gap-1"
              type="submit"
            >
              {isSaving ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.submit className="w-4 h-4" />
              )}
              <span>Submit</span>
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}
