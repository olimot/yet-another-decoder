export type ParsedTextEntry = {
  key: string;
  name: string;
  type: "text";
  value: string;
  parsed?: { type: string; value: ParsedEntry[] };
  warning?: string;
};

export type ParsedJSONEntry = {
  key: string;
  name: string;
  type: "value";
  value: boolean | number | null | ParsedEntry[];
};

export type ParsedEntry = ParsedJSONEntry | ParsedTextEntry;

function withWarning(entry: ParsedEntry, nDecoded: number, parentType: string) {
  if (entry.type !== "text") return entry;
  let warning: string | undefined;
  const type = entry.parsed?.type ?? "";
  if (
    parentType === "URLSearchParams" &&
    !nDecoded &&
    decodeURIComponent(entry.value) !== entry.value
  ) {
    warning = `URIComponent Not Encoded`;
  } else if (
    parentType !== "URLSearchParams" &&
    parentType !== "Cookies" &&
    nDecoded
  ) {
    warning = "Redundantly Encoded URIComponent";
  } else if (type === "JSON" && parentType === "JSON") {
    warning = "JSON in JSON";
  }
  return warning ? { ...entry, warning } : entry;
}

export function parse(
  entry: ParsedTextEntry,
  parentType?: string
): ParsedTextEntry;
export function parse(
  entry: ParsedJSONEntry,
  parentType?: string
): ParsedJSONEntry;
export function parse(entry: ParsedEntry, parentType = ""): ParsedEntry {
  if (entry.type !== "text") return entry;

  let { value: text } = entry;
  for (let nDecoded = 0; nDecoded < 3; nDecoded++) {
    if (/^[a-zA-Z0-9+/-_]=*$/.test(text)) return entry; // base64
    let json: object | null | undefined;
    try {
      const value = JSON.parse(text);
      if (typeof value === "object") json = value;
    } catch {
      json = undefined;
    }
    if (json === null) return entry;
    if (json !== undefined) {
      const mapEntryToParsed = (
        entry: [string, unknown],
        i: number
      ): ParsedEntry => {
        const key = `${i}.${entry[0]}=${JSON.stringify(entry[1])}`;
        if (typeof entry[1] === "string") {
          const [name, value] = entry;
          return parse({ name, key, type: "text", value }, "JSON");
        }
        if (typeof entry[1] !== "object" || entry[1] === null) {
          const value = entry[1] as boolean | number | null;
          return { name: entry[0], key, type: "value", value };
        }
        const value = Object.entries(entry[1]).map(mapEntryToParsed);
        return { name: entry[0], key, type: "value", value };
      };
      const value = Object.entries(json).map(mapEntryToParsed);
      const output = { ...entry, parsed: { type: "JSON", value } };
      return withWarning(output, nDecoded, parentType);
    }

    let url: URL | undefined;
    try {
      url = new URL(text);
    } catch {
      url = undefined;
    }
    if (url !== undefined) {
      const urlEntries: ParsedEntry[] = [];
      const addURLEntry = (name: string, value: string, deep = false) => {
        if (!value) return;
        const key = `${name}=${JSON.stringify(value)}`;
        const innerEntry: ParsedTextEntry = { key, name, type: "text", value };
        urlEntries.push(deep ? parse(innerEntry) : innerEntry);
      };
      addURLEntry("href", url.href);
      addURLEntry("hash", url.hash, true);
      addURLEntry("host", url.host);
      if (url.hostname !== url.host) addURLEntry("hostname", url.hostname);
      addURLEntry("password", url.password);
      addURLEntry("pathname", url.pathname, true);
      addURLEntry("port", url.port);
      addURLEntry("protocol", url.protocol);
      addURLEntry("searchParams", `${url.searchParams}`, true);
      const output = { ...entry, parsed: { type: "URL", value: urlEntries } };
      return withWarning(output, nDecoded, parentType);
    }

    const parseEqMap = (text: string, type: string, delimiter: string) => {
      if (!text.includes(delimiter)) return undefined;
      const value = text.split(delimiter).flatMap((it, i) => {
        if (!it) return [];
        const [name = "", value = ""] = it.split(/(?<=^[^=]*)=/);
        const key = `${i}.${name}=${JSON.stringify(value)}`;
        return [parse({ name, key, type: "text", value }, type)];
      });
      if (!value.length) return undefined;
      const output = { ...entry, parsed: { type, value } };
      return withWarning(output, nDecoded, parentType);
    };

    const cookies = parseEqMap(text, "Cookies", "; ");
    if (cookies !== undefined) return cookies;

    const urlencoded = parseEqMap(text, "URLSearchParams", "&");
    if (urlencoded !== undefined) return urlencoded;

    let decoded: string;
    try {
      decoded = decodeURIComponent(text);
    } catch {
      decoded = text;
    }
    if (decoded === text) return withWarning(entry, nDecoded, parentType);
    text = decoded;
  }
  return withWarning(entry, 2, parentType);
}
