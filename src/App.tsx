import clsx from "clsx";
import { useMemo, useRef, useState, type CSSProperties } from "react";

const parseSpecialFormats = (value: string) => {
  if (/[a-z0-9+-.]+:$/.test(value)) throw new Error("It is a protocol.");

  try {
    const entries: [string, string][] = [];
    const url = new URL(value);
    if (url.hash) entries.push(["hash", url.hash]);
    if (url.host) entries.push(["host", url.host]);
    if (url.hostname !== url.host) entries.push(["hostname", url.hostname]);
    if (url.password) entries.push(["password", url.password]);
    if (url.pathname) entries.push(["pathname", url.pathname]);
    if (url.port) entries.push(["port", url.port]);
    entries.push(["protocol", url.protocol]);
    entries.push(["searchParams", `${url.searchParams}`]);
    return [entries, "URL"] as [[string, string][], string];
  } catch {
    if (!value.includes("=")) throw new Error("No equal in the value");
    let entries: string[][];
    if (value.includes("; ")) {
      entries = value.split("; ").map((entry) => entry.split(/(?<=^[^=]*)=/));
      return [entries, ";="] as [[string, string][], string];
    }

    entries = value.split("&").map((entry) => entry.split(/(?<=^[^=]*)=/));
    return [entries, "&="] as [[string, string][], string];
  }
};

const parseJSONObjectOnly = (
  value: string,
  type = ""
): [[string, unknown][] | string, string] => {
  const parsed = JSON.parse(value);
  if (typeof parsed !== "object") return [value, type];
  return [Object.entries(parsed), `${type && `${type} `}JSON`];
};

function parse(value: unknown): [string | [string, unknown][], string] {
  if (value === undefined) return ["", ""];
  if (value === null) return ["null", "JSON"];
  if (typeof value === "object") return [Object.entries(value), ""];
  if (typeof value !== "string") return [`${value}`, typeof value];
  if (!value) return ["", ""];

  try {
    return parseJSONObjectOnly(value);
  } catch {
    try {
      return parseSpecialFormats(value);
    } catch {
      try {
        const decoded = decodeURIComponent(value);
        try {
          return parseJSONObjectOnly(decoded, "%xx");
        } catch {
          try {
            const [v, t] = parseSpecialFormats(decoded);
            return [v, `%xx${t && ` ${t}`}`];
          } catch {
            return [decoded, decoded === value ? "" : "%xx"];
          }
        }
      } catch {
        return [value, "string"];
      }
    }
  }
}

function ParsingType({ type, isError }: { type: string; isError?: boolean }) {
  if (!type) return null;

  if (isError) {
    return (
      <span
        className={clsx(
          "inline-block me-1 px-1 rounded-md font-mono text-xs bg-red-600 text-white select-none cursor-default"
        )}
      >
        {type}
      </span>
    );
  }
  let colorSet = "bg-gray-100";
  switch (type) {
    case "%xx":
      colorSet = "bg-blue-200";
      break;
    case "&=":
      colorSet = "bg-blue-600 text-white";
      break;
    case "JSON":
      colorSet = "bg-green-700 text-white";
      break;
    case "URL":
      colorSet = "bg-amber-700 text-white";
      break;
    case "string":
    case "number":
    case "boolean":
    case "object":
    case "undefined":
      colorSet = "bg-green-100";
      break;
  }
  return (
    <span
      className={clsx(
        "inline-block me-1 px-1 rounded-md font-mono text-xs select-none cursor-default",
        colorSet
      )}
    >
      {type}
    </span>
  );
}

function EntryItem({
  entry,
  tableType,
  depth,
}: {
  entry: [string, unknown];
  tableType?: string;
  depth: number;
}) {
  const [key, value] = entry;
  const [parsedValue, valueType] = useMemo(() => parse(value), [value]);
  const [isOpen, setOpen] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);
  let type = valueType;

  let expectedStartType: string[] | undefined;
  if (tableType?.endsWith("=")) expectedStartType = ["%xx"];
  if (tableType?.endsWith("JSON") || tableType === "object") {
    expectedStartType = ["string", "number", "boolean", "object"];
  }

  if (valueType === "") {
    if (tableType?.endsWith("=")) type = "%xx";
    if (!tableType || tableType.endsWith("JSON") || tableType === "object") {
      type = typeof parsedValue;
    }
  }

  if (
    (tableType?.endsWith("JSON") || tableType === "object") &&
    !type.startsWith("%xx") &&
    (type.endsWith("=") || type.endsWith("JSON"))
  ) {
    type = `string ${type}`;
  }

  const style = {
    "--depth-padding": `calc(var(--spacing) * ${depth} * 4.5)`,
  } as CSSProperties;

  const hasStructure = parsedValue !== null && typeof parsedValue === "object";

  return (
    <>
      <dt
        className={clsx(
          "col-start-1 pe-1 [:where(&:hover,&:has(+:hover))]:bg-gray-100 [&:focus-within,&:has(+:focus-within)]:bg-blue-100",
          hasStructure
            ? "ps-(--depth-padding)"
            : "ps-[calc(var(--depth-padding)+(var(--spacing)*3))]"
        )}
        style={style}
        onClick={() => keyInputRef.current?.focus()}
      >
        {hasStructure && (
          <span
            className={clsx(
              "inline-block me-0.5 cursor-pointer select-none",
              isOpen && "rotate-90"
            )}
            onClick={() => setOpen(!isOpen)}
          >
            ▶
          </span>
        )}
        <input
          className="text-pink-900"
          value={key}
          ref={keyInputRef}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => e.preventDefault()}
        />
      </dt>
      <dd
        className="col-start-2 grid grid-cols-[auto_1fr] [:where(:hover+&,&:hover)]:bg-gray-100 [:focus-within+&,&:focus-within]:bg-blue-100"
        onClick={(e) => e.preventDefault()}
      >
        <div>
          {type.split(" ").map((it, i) => (
            <ParsingType
              key={it}
              type={it}
              isError={i === 0 && expectedStartType?.includes(it) === false}
            />
          ))}
        </div>
        {(typeof value === "string" ||
          typeof value === "boolean" ||
          typeof value === "number" ||
          typeof value === "undefined") && (
          <input
            type="text"
            className="w-full"
            title={`${value}`}
            value={
              typeof value === "string" && type.includes("%xx")
                ? decodeURIComponent(value)
                : `${value}`
            }
            onChange={(e) => e.preventDefault()}
          />
        )}
      </dd>
      {hasStructure && (
        <dd
          className={clsx("col-start-1 col-span-2", !isOpen && "hidden")}
          style={style}
        >
          <dl className="grid grid-cols-[auto_1fr] gap-y-1 relative before:hidden [:is(:hover+dd+dd,:hover+dd,:focus-within+dd+dd,:focus-within+dd)>&]:before:block before:absolute before:w-px before:h-full before:bg-gray-200 [:is(:focus-within+dd+dd,:focus-within+dd)>&]:before:bg-blue-200 before:left-[calc(var(--depth-padding)+(var(--spacing)*3))]">
            {parsedValue.map((entry, i) => (
              <EntryItem
                key={`${entry[0]}.${i}`}
                entry={entry}
                tableType={type}
                depth={depth + 1}
              />
            ))}
          </dl>
        </dd>
      )}
    </>
  );
}

function App() {
  const [input, setInput] = useState("");
  const [parsedInput, type] = useMemo(() => parse(input), [input]);

  return (
    <div className="max-w-[854px] mx-auto my-2 text-sm px-2 selection:text-white selection:bg-blue-600 font-mono">
      <h1 className="text-2xl text-center my-2 font-sans">
        YET ANOTHER DECODER
      </h1>
      <textarea
        className="resize-y border rounded-sm px-2 py-1 my-2 w-full min-h-30"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div
        className={clsx(
          "border rounded-sm px-2 py-1 my-2 min-h-30 whitespace-pre-line",
          input === "" && "text-gray-400 flex items-center justify-center"
        )}
      >
        {typeof parsedInput === "string" ? (
          <span>
            {input === ""
              ? "Decoded/Parsed data will be shown here"
              : parsedInput}
          </span>
        ) : (
          <div className="w-full min-h-full">
            <div className="grid grid-cols-[auto_auto_1fr] justify-center items-center gap-1">
              <span className="font-bold">Root</span>
              <div>
                {type.split(" ").map((it) => (
                  <ParsingType key={it} type={it} />
                ))}
              </div>
              {typeof input === "string" && (
                <input
                  type="text"
                  className="w-full"
                  title={input}
                  value={
                    type.includes("%xx") ? decodeURIComponent(input) : input
                  }
                  readOnly
                />
              )}
            </div>
            <div className="my-2">
              <dl className="grid grid-cols-[auto_1fr] gap-y-1 border-l border-white relative">
                {parsedInput.map((entry, i) => (
                  <EntryItem
                    key={`${entry[0]}.${i}`}
                    entry={entry}
                    tableType={type}
                    depth={0}
                  />
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
