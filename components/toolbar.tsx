"use-client";

import { Icons } from "@/components/icons";
import { type Editor } from "@tiptap/react";

import { Toggle } from "@/components/ui/toggle";

type ToolbarProps = {
  editor: Editor | null;
};

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-2 rounded-md flex-wrap">
      <Toggle
        size="sm"
        pressed={editor.isActive("heading")}
        onPressedChange={() => {
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
      >
        <Icons.heading />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => {
          editor.chain().focus().toggleBold().run();
        }}
      >
        <Icons.bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => {
          editor.chain().focus().toggleItalic().run();
        }}
      >
        <Icons.italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => {
          editor.chain().focus().toggleUnderline().run();
        }}
      >
        <Icons.underline />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => {
          editor.chain().focus().toggleStrike().run();
        }}
      >
        <Icons.strikethrough />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => {
          editor.chain().focus().toggleCode().run();
        }}
      >
        <Icons.code />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => {
          editor.chain().focus().toggleBulletList().run();
        }}
      >
        <Icons.list />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => {
          editor.chain().focus().toggleOrderedList().run();
        }}
      >
        <Icons.listOrdered />
      </Toggle>
    </div>
  );
}

Toolbar.Skeleton = function ToolbarSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-md flex-wrap mb-2">
      <Toggle size="sm">
        <Icons.heading />
      </Toggle>
      <Toggle size="sm">
        <Icons.bold />
      </Toggle>
      <Toggle size="sm">
        <Icons.italic />
      </Toggle>
      <Toggle size="sm">
        <Icons.underline />
      </Toggle>
      <Toggle size="sm">
        <Icons.strikethrough />
      </Toggle>
      <Toggle size="sm">
        <Icons.code />
      </Toggle>
      <Toggle size="sm">
        <Icons.list />
      </Toggle>
      <Toggle size="sm">
        <Icons.listOrdered />
      </Toggle>
    </div>
  );
};
