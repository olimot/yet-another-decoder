import clsx from "clsx";
import { useMemo, useState, type CSSProperties } from "react";
import { parse, type ParsedEntry } from "./parser";

function getColorSet(type: string) {
  switch (type) {
    case "JSON":
      return "bg-green-200 text-green-800";
    case "URL":
      return "bg-amber-300 text-amber-900";
    case "Cookie":
      return "bg-pink-900";
    case "URLSearchParams":
      return "bg-fuchsia-100 text-fuchsia-900";
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
      className="contents"
      style={{ "--depth": `${depth}` } as CSSProperties}
    >
      <div className="flex items-center relative hover:bg-gray-100 focus-within:bg-blue-100 hover:focus-within:bg-blue-100">
        {depth > 0 && children.length > 0 && (
          <button
            type="button"
            className={clsx(
              "cursor-pointer p-1 absolute left-[calc((4*var(--depth)-4)*var(--spacing))]",
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
          className="ps-[calc(4*var(--depth)*var(--spacing))] pe-1 flex items-center justify-center"
          title={warning && `Warning: ${warning}`}
          tabIndex={0}
        >
          <div
            className={clsx(
              "whitespace-nowrap",
              !depth && "font-bold",
              warning ? "text-red-600" : "text-pink-900"
            )}
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
            "flex-auto whitespace-nowrap",
            entry.type === "text" ? "text-blue-900" : "text-blue-700"
          )}
          tabIndex={0}
          title={entry.type === "text" ? "string" : typeof entry.value}
        >
          {parentType === "URLSearchParams" || parentType === "Cookies"
            ? decodeURIComponent(lineValue)
            : lineValue}
        </div>
      </div>
      {children.length > 0 && (
        <ul
          className={clsx(
            "relative before:hidden [:is(:hover,:focus-within)+&]:before:block before:absolute before:w-px before:h-full [:hover+&]:before:bg-gray-200 [:focus-within+&]:before:bg-blue-200 before:left-[calc(4*var(--depth)*var(--spacing))] before:z-10",
            !isOpen && "hidden"
          )}
        >
          {children.map((it) => (
            <li key={it.key}>
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
        className="resize-y border rounded-sm px-2 py-1 w-full min-h-30 break-all"
        value={value}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <div
        className={clsx(
          "border rounded-sm px-2 py-1 overflow-scroll relative",
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
