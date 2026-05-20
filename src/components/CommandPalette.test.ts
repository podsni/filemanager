import { describe, expect, test } from "bun:test";
import {
  buildCommandPaletteItems,
  getNextCommandIndex,
  type CommandPaletteAction,
  type CommandPaletteFile,
} from "./CommandPalette";

const actions: CommandPaletteAction[] = [
  { id: "refresh", label: "Refresh", keywords: ["reload", "sync"], run: () => {} },
  { id: "new-folder", label: "New folder", keywords: ["create", "directory"], run: () => {} },
];

const files: CommandPaletteFile[] = [
  {
    name: "Quarterly report.pdf",
    type: "document",
    isDirectory: false,
    path: "docs/Quarterly report.pdf",
  },
  {
    name: "Photos",
    type: "folder",
    isDirectory: true,
    path: "Photos",
  },
];

describe("buildCommandPaletteItems", () => {
  test("returns matching actions and files for a query", () => {
    const items = buildCommandPaletteItems({
      query: "repo",
      actions,
      files,
    });

    expect(items.map((item) => item.label)).toEqual([
      "Quarterly report.pdf",
    ]);
  });

  test("returns actions before files for an empty query", () => {
    const items = buildCommandPaletteItems({
      query: "",
      actions,
      files,
    });

    expect(items.map((item) => item.id)).toEqual([
      "action:refresh",
      "action:new-folder",
      "file:docs/Quarterly report.pdf",
      "file:Photos",
    ]);
  });
});

describe("getNextCommandIndex", () => {
  test("wraps keyboard selection around the list", () => {
    expect(getNextCommandIndex(0, -1, 3)).toBe(2);
    expect(getNextCommandIndex(2, 1, 3)).toBe(0);
    expect(getNextCommandIndex(1, 1, 3)).toBe(2);
  });

  test("returns zero when the list is empty", () => {
    expect(getNextCommandIndex(5, 1, 0)).toBe(0);
  });
});
