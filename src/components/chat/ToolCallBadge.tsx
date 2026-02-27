"use client";

import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
}

function getFilename(args: Record<string, unknown>): string {
  const p = args.path as string | undefined;
  return p?.split("/").pop() ?? p ?? "";
}

function getLabel(
  toolName: string,
  args: Record<string, unknown>,
  isDone: boolean
): string {
  const filename = getFilename(args);
  const command = args.command as string | undefined;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return isDone ? `Created ${filename}` : `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return isDone ? `Edited ${filename}` : `Editing ${filename}`;
      case "view":
        return `Reading ${filename}`;
      case "undo_edit":
        return isDone ? `Reverted ${filename}` : `Reverting ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename":
        return isDone ? `Renamed ${filename}` : `Renaming ${filename}`;
      case "delete":
        return isDone ? `Deleted ${filename}` : `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const isDone = state === "result" && Boolean(result);
  const label = getLabel(toolName, args, isDone);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
