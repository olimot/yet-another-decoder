import clsx from "clsx";
import { useState } from "react";
import ParsedViewV1 from "./v1/ParsedView";
import ParsedViewV2 from "./v2/ParsedView";

function App() {
  const [input, setInput] = useState("");
  const [version, setVersionState] = useState(() => {
    return Number(window.localStorage.getItem("yadver")) || 2;
  });
  const setVersion = (version: number) => {
    window.localStorage.setItem("yadver", `${version}`);
    setVersionState(version);
  };
  return (
    <div className="mx-auto max-w-240 grid grid-rows-[auto_auto_1fr_3fr] w-full h-full text-sm p-6 selection:text-white selection:bg-blue-600 font-mono gap-2">
      <h1 className="text-2xl text-center font-sans">YET ANOTHER DECODER</h1>
      <div className="flex justify-center items-center gap-8">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="version"
            checked={version === 1}
            onChange={() => setVersion(1)}
          />
          <div>Fixed-Width View</div>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="version"
            checked={version === 2}
            onChange={() => setVersion(2)}
          />
          <div>Compact View</div>
        </label>
      </div>
      <textarea
        className="resize-y rounded-sm p-2 w-full min-h-30 break-all bg-white border border-gray-300 focus-within:outline-1 focus:border-blue-700 focus:outline-blue-700"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div
        className={clsx(
          "rounded-sm py-2 overflow-scroll relative bg-white border border-gray-300 focus-within:outline-1 focus-within:border-blue-700 focus-within:outline-blue-700",
          input === "" && "text-gray-400 flex items-center justify-center"
        )}
      >
        {version === 1 && <ParsedViewV1 input={input} />}
        {version === 2 && <ParsedViewV2 input={input} />}
      </div>
    </div>
  );
}

export default App;
