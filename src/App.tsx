import clsx from "clsx";
import { useState } from "react";
import ParsedView from "./v1/ParsedView";

function App() {
  const [input, setInput] = useState("");

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
        <ParsedView input={input} />
      </div>
    </div>
  );
}

export default App;
