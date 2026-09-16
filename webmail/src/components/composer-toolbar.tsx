"use client";

import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/cn";

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-sm text-sm transition-colors",
        active ? "bg-accent-soft text-accent-strong" : "text-ink-soft hover:bg-paper hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function ComposerToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 border-b border-hairline px-2 py-1.5">
      <ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolButton>
      <ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>i</em>
      </ToolButton>
      <ToolButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolButton>
      <span className="mx-1 h-4 w-px bg-hairline" />
      <ToolButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolButton>
      <ToolButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &ldquo;
      </ToolButton>
      <span className="mx-1 h-4 w-px bg-hairline" />
      <ToolButton
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const url = window.prompt("Link URL");
          if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        🔗
      </ToolButton>
    </div>
  );
}
