import clsx from "clsx";
import { useMemo, useState } from "react";

const parseAmpEqParams = (value: string) => {
  const qmIdx = value.indexOf("?");
  if (qmIdx > -1 && (!value.includes("&") || qmIdx < value.indexOf("&"))) {
    throw new Error("Could be URL");
  }
  if (!value.includes("&") && !value.includes("=")) {
    throw new Error("No ampersand and no equal in the text");
  }
  const entries = value.split("&").map((entry) => entry.split(/(?<=^[^=]*)=/));
  if (!entries.length) {
    throw new Error("No ampersand and no equal in the text");
  }
  return entries as [string, string][];
};

const parseJSONObjectOnly = (
  value: string,
  type = ""
): [[string, unknown][] | string, string] => {
  const parsed = JSON.parse(value);
  if (typeof parsed !== "object") return [value, type];
  return [Object.entries(parsed), `${type && `${type} `}JSON`];
};

function ParsingType({ type, isError }: { type: string; isError?: boolean }) {
  if (!type) return null;

  if (isError) {
    return (
      <span
        className={clsx(
          "inline-block me-1 px-1 rounded-md font-mono text-xs bg-red-600 text-white"
        )}
      >
        {type}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "inline-block me-1 px-1 rounded-md font-mono text-xs",
        type === "%xx" && "bg-blue-100",
        type === "&=" && "bg-blue-600 text-white",
        type === "JSON" && "bg-green-700 text-white",
        (!type ||
          type === "string" ||
          type === "number" ||
          type === "boolean" ||
          type === "object" ||
          type === "undefined") &&
          "bg-green-100"
      )}
    >
      {type}
    </span>
  );
}

function parse(value: unknown): [string | [string, unknown][], string] {
  if (value === undefined) return ["", ""];
  if (value === null) return ["null", "JSON"];
  if (typeof value === "object") return [Object.entries(value), ""];
  if (typeof value !== "string") return [`${value}`, typeof value];
  if (!value) return ["", ""];

  try {
    return [parseAmpEqParams(value), "&="];
  } catch {
    try {
      return parseJSONObjectOnly(value);
    } catch {
      try {
        const decoded = decodeURIComponent(value);
        try {
          return [parseAmpEqParams(decoded), "%xx &="];
        } catch {
          try {
            return parseJSONObjectOnly(decoded, "%xx");
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

function EntryItem({
  entry,
  tableType,
}: {
  entry: [string, unknown];
  tableType?: string;
}) {
  const [isOpen, setOpen] = useState(false);

  const [key, value] = entry;
  const [parsedValue, valueType] = useMemo(() => parse(value), [value]);
  let type = valueType;

  let expectedStartType: string[] | undefined;
  if (tableType?.endsWith("&=")) expectedStartType = ["%xx"];
  if (tableType?.endsWith("JSON") || tableType === "object") {
    expectedStartType = ["string", "number", "boolean", "object"];
  }

  if (valueType === "") {
    if (tableType?.endsWith("&=")) {
      type = "%xx";
    }
    if (!tableType || tableType.endsWith("JSON") || tableType === "object") {
      type = typeof parsedValue;
    }
  }

  if (
    (tableType?.endsWith("JSON") || tableType === "object") &&
    !type.startsWith("%xx") &&
    (type.endsWith("&=") || type.endsWith("JSON"))
  ) {
    type = `string ${type}`;
  }

  if (parsedValue === null || typeof parsedValue === "string") {
    return (
      <>
        <dt className="col-start-1" title={`${value}`}>
          <span className="text-pink-900">{key}</span>
        </dt>
        <dd
          className="col-start-2 grid grid-cols-[auto_1fr]"
          title={parsedValue}
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
          <div className="break-all truncate" title={parsedValue}>
            {parsedValue}
          </div>
        </dd>
      </>
    );
  }

  return (
    <>
      <dt
        className="col-start-1 cursor-pointer"
        onClick={() => setOpen(!isOpen)}
      >
        {isOpen ? "▼" : "▶"} <span className="text-pink-900">{key}</span>
      </dt>
      <dd className="col-start-2 grid grid-cols-[auto_1fr]">
        <div>
          {type.split(" ").map((it, i) => (
            <ParsingType
              key={it}
              type={it}
              isError={i === 0 && expectedStartType?.includes(it) === false}
            />
          ))}
        </div>
        {typeof value === "string" && (
          <div className="break-all truncate" title={value}>
            {type.includes("%xx") ? decodeURIComponent(value) : value}
          </div>
        )}
      </dd>
      {isOpen && (
        <dd className="col-start-1 col-span-2">
          <EntryTable entries={parsedValue} type={type} />
        </dd>
      )}
    </>
  );
}

function EntryTable({
  entries,
  type,
}: {
  entries: [string, unknown][];
  type?: string;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] border-1 rounded-sm p-1 gap-1 font-mono">
      {entries.map((entry, i) => (
        <EntryItem key={`${entry[0]}.${i}`} entry={entry} tableType={type} />
      ))}
    </dl>
  );
}

function App() {
  const [input, setInput] = useState("");
  const [parsedInput, type] = useMemo(() => parse(input), [input]);

  return (
    <div className="max-w-[854px] mx-auto my-2">
      <h1 className="text-2xl text-center my-2">YET ANOTHER DECODER</h1>
      <textarea
        className="resize-y border-1 rounded-sm px-1 my-2 w-full min-h-30 font-mono"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div className="grid grid-cols-[auto_auto_1fr] justify-center items-center gap-1">
        <span className="font-bold">Root</span>
        <div>
          {type.split(" ").map((it) => (
            <ParsingType key={it} type={it} />
          ))}
        </div>
      </div>
      {typeof parsedInput === "string" ? (
        <div
          className={clsx(
            "border-1 rounded-sm px-1 my-2 min-h-30 whitespace-pre-line font-mono",
            input === "" && "text-gray-400 flex items-center justify-center"
          )}
        >
          {input === ""
            ? "Decoded/Parsed data will be shown here"
            : parsedInput}
        </div>
      ) : (
        <EntryTable entries={parsedInput} type={type} />
      )}
    </div>
  );
}

export default App;
