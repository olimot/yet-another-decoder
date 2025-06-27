import { useMemo } from "react";
import EntryItem from "./EntryItem";
import { parse } from "./parser";

export default function ParsedView({ input }: { input: string }) {
  const entry = useMemo(() => parse(input), [input]);
  return entry.parsed ? (
    <EntryItem entry={entry} />
  ) : (
    <span>{entry.value || "Decoded/Parsed data will be shown here"}</span>
  );
}
