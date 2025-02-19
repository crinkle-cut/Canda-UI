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
            <ul class="flex flex-col min-h-screen justify-between">
              <li class="p-2 transition-all duration-300 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>
              </li>
              <li class="p-2 transition-all duration-300 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
              </li>
              <li class="p-2 mb-auto transition-all duration-300 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
              </li>
              <li class="p-2 mb-30 transition-all duration-300 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
              </li>
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
