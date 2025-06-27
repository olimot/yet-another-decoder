export type ParsedTextEntry = {
  key: string;
  name: string;
  type: "text";
  value: string;
  parsed?: { type: string; value: ParsedEntry[] };
  warning?: string;
  nDecoded: number;
};

export type ParsedJSONEntry = {
  key: string;
  name: string;
  type: "value";
  value: boolean | number | null | ParsedEntry[];
};

export type ParsedEntry = ParsedJSONEntry | ParsedTextEntry;

export function urldecode(text: string) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export function urlencode(text: string) {
  try {
    return encodeURIComponent(text);
  } catch {
    return text;
  }
}

const mapEntryToParsed =
  (parent?: string) =>
  (entry: [string, unknown], i: number): ParsedEntry => {
    const key = `${i}.${entry[0]}=${JSON.stringify(entry[1])}`;
    if (typeof entry[1] === "string") {
      const [name, value] = entry;
      return parse({ name, key, type: "text", value, nDecoded: 0 }, parent);
    }
    if (typeof entry[1] !== "object" || entry[1] === null) {
      const value = entry[1] as boolean | number | null;
      return { name: entry[0], key, type: "value", value };
    }
    const value = Object.entries(entry[1]).map(mapEntryToParsed(parent));
    return { name: entry[0], key, type: "value", value };
  };

const addTextEntryIfFilled =
  (entries: ParsedEntry[]) =>
  (name: string, value: string, parent?: string) => {
    if (!value) return;
    const key = `${name}=${JSON.stringify(value)}`;
    const entry = { key, type: "text" as const, name, value, nDecoded: 0 };
    entries.push(parent === undefined ? entry : parse(entry, parent));
  };

const parseEqMap = (text: string, type: string, delimiter: string) => {
  const value = text.split(delimiter).flatMap((it, i) => {
    if (!it) return [];
    const [name = "", value = ""] = it.split(/(?<=^[^=]*)=/);
    return [mapEntryToParsed(type)([name, value], i)];
  });
  return value.length ? { type, value } : undefined;
};

export function parse(entry: string, parentType?: string): ParsedTextEntry;
export function parse(
  entry: ParsedTextEntry,
  parentType?: string
): ParsedTextEntry;
export function parse(
  entry: ParsedJSONEntry,
  parentType?: string
): ParsedJSONEntry;
export function parse(
  arg0: ParsedTextEntry | ParsedJSONEntry | string,
  parentType = ""
): ParsedEntry {
  let entry: ParsedEntry;
  if (typeof arg0 !== "string") entry = arg0;
  else entry = { key: arg0, name: "", type: "text", value: arg0, nDecoded: 0 };

  if (entry.type !== "text") return entry;

  let { value: text } = entry;
  let output = entry;
  let nDecoded = 0;
  for (nDecoded = 0; nDecoded < 3; nDecoded++) {
    if (/^[a-zA-Z0-9+/_-]+=*$/.test(text)) break; // base64

    let json: object | null | undefined;
    try {
      const value = JSON.parse(text);
      if (typeof value === "object") json = value;
    } catch {
      json = undefined;
    }
    if (json === null) break;
    if (json !== undefined) {
      const value = Object.entries(json).map(mapEntryToParsed("JSON"));
      output = { ...entry, parsed: { type: "JSON", value } };
      break;
    }

    let url: URL | undefined;
    try {
      url = new URL(text);
    } catch {
      url = undefined;
    }
    if (url !== undefined) {
      const urlEntries: ParsedEntry[] = [];
      const addURLEntry = addTextEntryIfFilled(urlEntries);
      addURLEntry("href", url.href);
      addURLEntry("hash", url.hash, "URL");
      addURLEntry("host", url.host);
      if (url.hostname !== url.host) addURLEntry("hostname", url.hostname);
      addURLEntry("password", url.password);
      addURLEntry("pathname", url.pathname, "URL");
      addURLEntry("port", url.port);
      addURLEntry("protocol", url.protocol);
      addURLEntry("searchParams", `${url.searchParams}`, "URL");
      output = { ...entry, parsed: { type: "URL", value: urlEntries } };
      break;
    }

    if (text.includes("=")) {
      if (text.includes("; ")) {
        const cookies = parseEqMap(text, "Cookies", "; ");
        if (cookies !== undefined) {
          output = { ...entry, parsed: cookies };
          break;
        }
      }
      const searchParams = parseEqMap(text, "URLSearchParams", "&");
      if (searchParams !== undefined) {
        output = { ...entry, parsed: searchParams };
        break;
      }
    }

    const decoded = urldecode(text);
    if (decoded === text) break;
    text = decoded;
  }

  let warning: string | undefined;
  const type = output.parsed?.type ?? "";
  if (
    parentType === "URLSearchParams" &&
    !nDecoded &&
    urlencode(output.value) !== output.value
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
  return warning ? { ...output, warning, nDecoded } : { ...output, nDecoded };
}
