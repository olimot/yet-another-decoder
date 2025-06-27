import clsx from "clsx";
import { type ParsedTextEntry } from "./parser";
import EntryItem from "./EntryItem";

export default function ParsedView({ entry }: { entry: ParsedTextEntry }) {
  return (
    <div
      className={clsx(
        "rounded-sm py-2 overflow-scroll relative bg-white border border-gray-300 focus-within:outline-1 focus-within:border-blue-700 focus-within:outline-blue-700",
        entry.value === "" && "text-gray-400 flex items-center justify-center"
      )}
    >
      {entry.parsed ? (
        <EntryItem entry={entry} />
      ) : (
        <span>{entry.value || "Decoded/Parsed data will be shown here"}</span>
      )}
    </div>
  );
}
