import clsx from "clsx";
import { useState, type CSSProperties } from "react";
import { urldecode, type ParsedEntry } from "./parser";

function getColorSet(type: string) {
  switch (type) {
    case "JSON":
      return "bg-cyan-200 text-cyan-800";
    case "URL":
      return "bg-amber-100 text-amber-800";
    case "Cookie":
      return "bg-pink-900";
    case "URLSearchParams":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100";
  }
}

const selectAllText: React.PointerEventHandler = (event) => {
  const element = event.currentTarget as HTMLElement;
  const sel = window.getSelection();
  if (document.activeElement !== element.parentElement) {
    event.preventDefault();
    element.parentElement?.focus();
    sel?.selectAllChildren(element);
  }
};

export default function EntryItem({
  entry,
  parentType,
  depth = 0,
}: {
  entry: ParsedEntry;
  parentType?: string;
  depth?: number;
}) {
  const [isOpen, setOpen] = useState(depth === 0 || entry.type !== "text");

  const warning = entry.type === "text" ? entry.warning : undefined;

  let lineValue = "";
  if (entry.type === "text") lineValue = entry.value;
  else if (!Array.isArray(entry.value)) lineValue = `${entry.value}`;

  let children: ParsedEntry[] = [];
  if (Array.isArray(entry.value)) children = entry.value;
  else if (entry.type === "text" && entry.parsed) children = entry.parsed.value;

  return (
    <div
      className="grid grid-rows-[auto_auto]"
      style={{ "--depth": `${depth}` } as CSSProperties}
    >
      <div className="flex items-center relative hover:bg-gray-100 focus-within:bg-blue-100 hover:focus-within:bg-blue-100">
        {depth > 0 && children.length > 0 && (
          <button
            type="button"
            className={clsx(
              "cursor-pointer p-1 absolute left-[calc((4*var(--depth)-2)*var(--spacing))]",
              isOpen && "rotate-90"
            )}
            onClick={() => setOpen(!isOpen)}
          >
            <svg className="w-2 h-2" viewBox="0 0 12 12" fill="currentColor">
              <path d="M 9 6 l -6 -6 l 0 12"></path>
            </svg>
          </button>
        )}
        <div
          className="ps-[calc((4*var(--depth)+2)*var(--spacing))] pe-1 flex items-center justify-center"
          title={warning && `Warning: ${warning}`}
          tabIndex={0}
        >
          <div
            className={clsx(
              "whitespace-nowrap",
              depth ? "text-pink-900" : "font-bold",
              warning && "underline decoration-wavy decoration-green-700"
            )}
            onPointerDown={selectAllText}
          >
            {depth ? entry.name : "Root"}
          </div>
          {entry.type === "text" && entry.parsed && (
            <div
              className={clsx(
                "rounded-md px-1 ms-0.5 text-xs",
                getColorSet(entry.parsed?.type)
              )}
            >
              {entry.parsed?.type}
            </div>
          )}
          :
        </div>
        <div
          className={clsx(
            "flex-auto whitespace-nowrap min-h-5",
            entry.type !== "text" && "text-blue-800"
          )}
          tabIndex={0}
          title={entry.type === "text" ? "string" : typeof entry.value}
        >
          <span onPointerDown={selectAllText}>
            {(parentType === "URLSearchParams" || parentType === "Cookies") &&
            entry.type === "text" &&
            entry.nDecoded !== 0
              ? urldecode(lineValue)
              : lineValue}
          </span>
        </div>
      </div>
      {children.length > 0 && (
        <ul
          className={clsx(
            "relative before:hidden [:is(:hover,:focus-within)+&]:before:block before:absolute before:w-px before:h-full [:hover+&]:before:bg-gray-200 [:focus-within+&]:before:bg-blue-200 before:left-[calc((4*var(--depth)+2)*var(--spacing))] before:z-10",
            !isOpen && "hidden"
          )}
        >
          {children.map((it) => (
            <li key={it.key} className="contents">
              <EntryItem
                entry={it}
                depth={depth + 1}
                parentType={
                  entry.type === "text" && entry.parsed?.type
                    ? entry.parsed.type
                    : parentType
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
