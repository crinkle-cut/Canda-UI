import { createSignal, onMount, onCleanup } from "solid-js";
import * as MonacoEditor from "monaco-editor";
import githubDarkTheme from "./themes/github-dark.json";
import "./App.css";
import "./output.css";
import "./input.css";

function App() {
  let editorContainer: HTMLDivElement | null = null;
  let editorInstance: MonacoEditor.editor.IStandaloneCodeEditor | null = null;
  const [menuExpanded, setMenuExpanded] = createSignal(false);

  onMount(() => {
    if (editorContainer) {
      MonacoEditor.editor.defineTheme("github-dark", githubDarkTheme);
      MonacoEditor.editor.setTheme("github-dark");
      editorInstance = MonacoEditor.editor.create(editorContainer, {
        value: `-- hello!`,
        language: "lua",
        theme: "github-dark",
        fontFamily: "'0xProto', 'Menlo', 'Monaco', monospace",
        fontSize: 12,
        automaticLayout: true,
      });

      const resizeObserver = new ResizeObserver(() => {
        editorInstance?.layout();
      });
      resizeObserver.observe(editorContainer);

      onCleanup(() => {
        resizeObserver.disconnect();
      });
    }
  });

  onCleanup(() => {
    if (editorInstance) {
      editorInstance.dispose();
    }
  });

  return (
    <main class="flex flex-col w-full h-full min-h-screen">
      <div
        class="title-bar w-full text-white text-sm font-medium flex items-center justify-center select-none border-b border-white/10 z-30"
        style={{ "-webkit-app-region": "drag" }}
        data-tauri-drag-region
      ></div>
      <div class="main-content flex h-full relative">
        <div
          class={`side-menu bg-black/60 border-2 border-white/40 rounded-xl transition-all duration-300 mt-40 absolute top-0 left-0 overflow-hidden w-auto hover:border-white/80 ${
            menuExpanded() ? "h-[435px]" : "h-11"
          } flex-shrink-0`}
        >
          <div
            class="p-2 cursor-pointer hover:border-white/80 rounded-xl"
            onClick={() => setMenuExpanded(!menuExpanded())}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-menu"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </div>
          {menuExpanded() && (
            <ul class="mt-4">
              <li></li>
              <li></li>
              <li></li>
            </ul>
          )}
        </div>
        <div ref={(el) => (editorContainer = el)} class="editor-container flex-grow"></div>
        <div class="button-bar flex relative">
          <div class="attach-button rounded-lg pb-2 pt-2 pl-3 pr-3 select-none cursor-pointer border-2 border-white/50 hover:border-red-500 transition-all delay-50 active:scale-95">
            Attach
          </div>
          <div class="execute-button rounded-lg ml-auto pb-2 pt-2 pl-3 pr-3 select-none cursor-pointer border-2 border-white/50 hover:border-green-500 transition-all delay-50 active:scale-95">
            Execute
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
