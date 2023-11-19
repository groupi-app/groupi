"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./toolbar";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

const isActuallyEmpty = (html: string) => {
  const emptyElementPattern = /^<(\w+)(\s[^>]*)?>\s*<\/\1>$/;
  const nonAlphanumericPattern = /^[^0-9a-zA-Z]+$/;
  const trimmedHtml = html.trim();

  // Check if the HTML string is an empty tag or contains only non-alphanumeric characters
  return (
    emptyElementPattern.test(trimmedHtml) ||
    nonAlphanumericPattern.test(trimmedHtml)
  );
};

export function Tiptap({
  content,
  placeholder,
  onChange,
}: {
  content: string;
  placeholder: string;
  onChange: (richText: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: { class: "list-disc list-outside ml-8" },
        },
        orderedList: {
          HTMLAttributes: { class: "list-decimal list-outside ml-8" },
        },
        code: {
          HTMLAttributes: {
            class: "text-sm rounded-md bg-muted p-2 px-2 mx-1",
          },
        },
      }),
      Heading.configure({
        HTMLAttributes: { class: "text-2xl font-heading", levels: [2] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class:
          "min-h-[150px] rounded-md bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      },
    },
    onUpdate({ editor }) {
      if (!isActuallyEmpty(editor.getHTML())) {
        onChange(editor.getHTML());
      } else {
        onChange("");
      }
    },
  });

  return (
    <div className="flex flex-col justify-stretch gap-3">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
