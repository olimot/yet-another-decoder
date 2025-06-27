import clsx from "clsx";
import { useMemo, useState, type CSSProperties } from "react";
import { parse, type ParsedEntry } from "./parser";

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

function EntryItem({
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
              !depth && "font-bold",
              "text-pink-900",
              warning && "underline decoration-wavy decoration-green-700"
            )}
            onPointerDown={(e) => {
              const div = e.currentTarget;
              const sel = window.getSelection();
              if (sel?.focusNode === div) {
                e.preventDefault();
                sel.collapseToEnd();
              } else {
                e.preventDefault();
                sel?.selectAllChildren(div);
              }
            }}
          >
            {depth ? entry.name : "Root"}
          </div>
          {entry.type === "text" && entry.parsed && (
            <div
              className={clsx(
                "rounded-sm px-1 ms-0.5 text-xs",
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
            entry.type !== "text" && "text-blue-700"
          )}
          tabIndex={0}
          title={entry.type === "text" ? "string" : typeof entry.value}
        >
          <span
            onPointerDown={(e) => {
              const div = e.currentTarget;
              const sel = window.getSelection();
              if (sel?.focusNode === div) {
                e.preventDefault();
                sel.collapseToEnd();
              } else {
                e.preventDefault();
                sel?.selectAllChildren(div);
              }
            }}
          >
            {parentType === "URLSearchParams" || parentType === "Cookies"
              ? decodeURIComponent(lineValue)
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

function App() {
  const [value, setText] = useState("");
  const parsedEntry = useMemo(
    () => parse({ name: "", key: "", type: "text", value }),
    [value]
  );

  const { parsed } = parsedEntry;
  return (
    <div className="mx-auto max-w-240 grid grid-rows-[auto_1fr_3fr] w-full h-full text-sm p-6 selection:text-white selection:bg-blue-600 font-mono gap-2">
      <h1 className="text-2xl text-center font-sans">YET ANOTHER DECODER</h1>
      <textarea
        className="resize-y rounded-sm p-2 w-full min-h-30 break-all bg-white border border-gray-300 focus-within:outline-1 focus:border-blue-700 focus:outline-blue-700"
        value={value}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <div
        className={clsx(
          "rounded-sm py-2 overflow-scroll relative bg-white border border-gray-300 focus-within:outline-1 focus-within:border-blue-700 focus-within:outline-blue-700",
          value === "" && "text-gray-400 flex items-center justify-center"
        )}
      >
        {parsed ? (
          <EntryItem entry={parsedEntry} parentType={parsed.type} />
        ) : (
          <span>{value || "Decoded/Parsed data will be shown here"}</span>
        )}
      </div>
    </div>
  );
}

export default App;
