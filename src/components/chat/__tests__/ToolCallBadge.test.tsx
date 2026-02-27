import { afterEach, describe, expect, test } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

describe("str_replace_editor create", () => {
  test("shows 'Creating' when pending", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/components/Card.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Creating Card.jsx")).toBeDefined();
  });

  test("shows 'Created' when done", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/components/Card.jsx" }}
        state="result"
        result="Success"
      />
    );
    expect(screen.getByText("Created Card.jsx")).toBeDefined();
  });
});

describe("str_replace_editor str_replace", () => {
  test("shows 'Editing' when pending", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "str_replace", path: "/components/Card.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Editing Card.jsx")).toBeDefined();
  });

  test("shows 'Edited' when done", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "str_replace", path: "/components/Card.jsx" }}
        state="result"
        result="Success"
      />
    );
    expect(screen.getByText("Edited Card.jsx")).toBeDefined();
  });
});

describe("str_replace_editor insert", () => {
  test("shows 'Editing' when pending", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "insert", path: "/App.jsx" }}
        state="partial-call"
      />
    );
    expect(screen.getByText("Editing App.jsx")).toBeDefined();
  });

  test("shows 'Edited' when done", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "insert", path: "/App.jsx" }}
        state="result"
        result="Success"
      />
    );
    expect(screen.getByText("Edited App.jsx")).toBeDefined();
  });
});

describe("str_replace_editor view", () => {
  test("shows 'Reading' when pending", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "view", path: "/App.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Reading App.jsx")).toBeDefined();
  });

  test("shows 'Reading' when done (same label both states)", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "view", path: "/App.jsx" }}
        state="result"
        result="file contents"
      />
    );
    expect(screen.getByText("Reading App.jsx")).toBeDefined();
  });
});

describe("str_replace_editor undo_edit", () => {
  test("shows 'Reverting' when pending", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "undo_edit", path: "/App.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Reverting App.jsx")).toBeDefined();
  });

  test("shows 'Reverted' when done", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "undo_edit", path: "/App.jsx" }}
        state="result"
        result="Success"
      />
    );
    expect(screen.getByText("Reverted App.jsx")).toBeDefined();
  });
});

describe("file_manager delete", () => {
  test("shows 'Deleting' when pending", () => {
    render(
      <ToolCallBadge
        toolName="file_manager"
        args={{ command: "delete", path: "/components/Old.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Deleting Old.jsx")).toBeDefined();
  });

  test("shows 'Deleted' when done", () => {
    render(
      <ToolCallBadge
        toolName="file_manager"
        args={{ command: "delete", path: "/components/Old.jsx" }}
        state="result"
        result={{ success: true }}
      />
    );
    expect(screen.getByText("Deleted Old.jsx")).toBeDefined();
  });
});

describe("file_manager rename", () => {
  test("shows 'Renaming' when pending", () => {
    render(
      <ToolCallBadge
        toolName="file_manager"
        args={{ command: "rename", path: "/components/Old.jsx", new_path: "/components/New.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Renaming Old.jsx")).toBeDefined();
  });

  test("shows 'Renamed' when done", () => {
    render(
      <ToolCallBadge
        toolName="file_manager"
        args={{ command: "rename", path: "/components/Old.jsx", new_path: "/components/New.jsx" }}
        state="result"
        result={{ success: true }}
      />
    );
    expect(screen.getByText("Renamed Old.jsx")).toBeDefined();
  });
});

describe("fallback for unknown tools", () => {
  test("shows raw toolName for unknown tool", () => {
    render(
      <ToolCallBadge
        toolName="some_unknown_tool"
        args={{ command: "do_something", path: "/foo.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("some_unknown_tool")).toBeDefined();
  });

  test("shows raw toolName when args has no command", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{}}
        state="result"
        result="ok"
      />
    );
    expect(screen.getByText("str_replace_editor")).toBeDefined();
  });
});

describe("filename extraction", () => {
  test("extracts filename from a nested path", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/deeply/nested/path/Component.tsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Creating Component.tsx")).toBeDefined();
  });

  test("extracts filename from a root-level path", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
  });

  test("handles missing path gracefully", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create" }}
        state="call"
      />
    );
    expect(screen.getByText(/^Creating\s*$/)).toBeDefined();
  });
});

describe("icon rendering", () => {
  test("renders spinner when state=call", () => {
    const { container } = render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.jsx" }}
        state="call"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("animate-spin");
  });

  test("renders spinner when state=partial-call", () => {
    const { container } = render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.jsx" }}
        state="partial-call"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("animate-spin");
  });

  test("renders spinner when state=result but result is falsy", () => {
    const { container } = render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.jsx" }}
        state="result"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("animate-spin");
  });

  test("renders green dot when state=result and result is truthy", () => {
    const { container } = render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.jsx" }}
        state="result"
        result="Success"
      />
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  });
});

describe("pill visual design", () => {
  test("wrapper has correct classes", () => {
    const { container } = render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.jsx" }}
        state="call"
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("inline-flex");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("bg-neutral-50");
    expect(wrapper.className).toContain("rounded-lg");
    expect(wrapper.className).toContain("border-neutral-200");
    expect(wrapper.className).toContain("text-xs");
  });

  test("label span does not use font-mono", () => {
    render(
      <ToolCallBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.jsx" }}
        state="call"
      />
    );
    const span = screen.getByText("Creating App.jsx");
    expect(span.className).not.toContain("font-mono");
  });
});
