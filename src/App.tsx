import { useMemo, useState } from "react";
import { parse } from "./v2/parser";
import ParsedView from "./v2/ParsedView";

function App() {
  const [value, setText] = useState("");
  const rootEntry = useMemo(() => parse(value), [value]);

  return (
    <div className="mx-auto max-w-240 grid grid-rows-[auto_1fr_3fr] w-full h-full text-sm p-6 selection:text-white selection:bg-blue-600 font-mono gap-2">
      <h1 className="text-2xl text-center font-sans">YET ANOTHER DECODER</h1>
      <textarea
        className="resize-y rounded-sm p-2 w-full min-h-30 break-all bg-white border border-gray-300 focus-within:outline-1 focus:border-blue-700 focus:outline-blue-700"
        value={value}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <ParsedView entry={rootEntry} />
    </div>
  );
}

export default App;
