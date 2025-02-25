import { createSignal, onMount, onCleanup, createEffect, batch } from "solid-js";
import { getCurrentWindow } from '@tauri-apps/api/window';
import * as Monaco from "monaco-editor";
import "./App.css";
import "./output.css";
import "./input.css";

const [editorInstance, setEditorInstance] = createSignal<Monaco.editor.IStandaloneCodeEditor | null>(null);

const customTheme = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { background: "282828", token: "" },
    { foreground: "928374", fontStyle: "italic", token: "comment" },
    { foreground: "83a598", fontStyle: "bold", token: "keyword" },
    { foreground: "83a598", fontStyle: "bold", token: "storage" },
    { foreground: "d79921", token: "constant.numeric" },
    { foreground: "fb4934", fontStyle: "bold", token: "constant" },
    { foreground: "b16286", fontStyle: "bold", token: "constant.language" },
    { foreground: "8ec07c", token: "variable.language" },
    { foreground: "8ec07c", token: "variable.other" },
    { foreground: "b8bb26", token: "string" },
    { foreground: "d79921", token: "constant.character.escape" },
    { foreground: "d79921", token: "string source" },
    { foreground: "8ec07c", token: "meta.preprocessor" },
    { foreground: "d65d0e", fontStyle: "bold", token: "keyword.control.import" },
    { foreground: "fe8019", fontStyle: "bold", token: "entity.name.function" },
    { foreground: "fe8019", fontStyle: "bold", token: "keyword.other.name-of-parameter.objc" },
    { fontStyle: "underline", token: "entity.name.type" },
    { fontStyle: "italic", token: "entity.other.inherited-class" },
    { fontStyle: "italic", token: "variable.parameter" },
    { foreground: "b8bb26", token: "storage.type.method" },
    { fontStyle: "italic", token: "meta.section entity.name.section" },
    { fontStyle: "italic", token: "declaration.section entity.name.section" },
    { foreground: "8ec07c", fontStyle: "bold", token: "support.function" },
    { foreground: "b16286", fontStyle: "bold", token: "support.class" },
    { foreground: "b16286", fontStyle: "bold", token: "support.type" },
    { foreground: "d79921", fontStyle: "bold", token: "support.constant" },
    { foreground: "83a598", fontStyle: "bold", token: "support.variable" },
    { foreground: "fb4934", token: "keyword.operator.js" },
    { foreground: "ffffff", background: "9d0006", token: "invalid" },
    { background: "7c6f64", token: "invalid.deprecated.trailing-whitespace" },
    { background: "3c3836", token: "text source" },
    { background: "3c3836", token: "string.unquoted" },
    { foreground: "928374", token: "meta.tag.preprocessor.xml" },
    { foreground: "928374", token: "meta.tag.sgml.doctype" },
    { fontStyle: "italic", token: "string.quoted.docinfo.doctype.DTD" },
    { foreground: "83a598", token: "meta.tag" },
    { foreground: "83a598", token: "declaration.tag" },
    { fontStyle: "bold", token: "entity.name.tag" },
    { fontStyle: "italic", token: "entity.other.attribute-name" }
  ],
  colors: {
    "editor.foreground": "#c8c8c8",
    "editor.background": "#0f0f0f",
    "editor.selectionBackground": "#504945",
    "editor.lineHighlightBackground": "#1E1E1E",
    "editorCursor.foreground": "#ebdbb2",
    "editorWhitespace.foreground": "#BFBFBF",
    "minimap.background": "#141414"
  }
} as Monaco.editor.IStandaloneThemeData;

function App() {
  let editorContainer: HTMLDivElement | null = null;
  const [menuExpanded, setMenuExpanded] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal(0);
  const [tabs, setTabs] = createSignal<{ content: string }[]>([
    { content: "-- hello!" },
  ]);
  const [editorContent, setEditorContent] = createSignal("");

  const setupTitlebarButtons = async () => {
    const appWindow = await getCurrentWindow();
    const buttons = [
      { id: 'titlebar-minimize', action: () => appWindow.minimize() },
      { id: 'titlebar-maximize', action: () => appWindow.toggleMaximize() },
      { id: 'titlebar-close', action: () => appWindow.close() }
    ];

    buttons.forEach(({ id, action }) => {
      const button = document.getElementById(id);
      if (button) button.addEventListener('click', action);
    });
  };

  createEffect(() => {
    const instance = editorInstance();
    if (instance) {
      instance.setValue(tabs()[activeTab()].content);
    }
  });

  onMount(async () => {
    await setupTitlebarButtons();

    Monaco.editor.defineTheme("customTheme", customTheme);

    if (editorContainer) {
      Monaco.editor.setTheme("customTheme");
      const instance = Monaco.editor.create(editorContainer, {
        value: tabs()[activeTab()].content, /* aint no way my ass coded this shit 💀💔 */
        language: "lua",
        fontFamily: "'0xProto'",
        fontSize: 14,
        automaticLayout: true,
        cursorSmoothCaretAnimation: "on",
      });

      setEditorInstance(instance);

      instance.onDidChangeModelContent(() => {
        setEditorContent(instance.getValue()); // Update editorContent on changes
      });

      const resizeObserver = new ResizeObserver(() => {
        instance.layout();
      });
      resizeObserver.observe(editorContainer);

      onCleanup(() => {
        resizeObserver.disconnect();
        instance.dispose();
      });
    }
  });

  const handleTabClick = (index: number) => {
    const instance = editorInstance();
    if (instance) {
      batch(() => { // use ts shi for multiple state updates
        setTabs(
          tabs().map((tab, i) =>
            i === activeTab() ? { content: editorContent() } : tab // save editorContent
          )
        );
        setActiveTab(index);
        instance.setValue(tabs()[index].content); // set value *after* activeTab update
        setEditorContent(tabs()[index].content); // update editorContent :D
      });
    }
  };

  return (
    <main class="flex flex-col w-full h-full min-h-screen select-none inset-shadow-sm" id="main">
      {/* Title bar */}
      <div
        class="title-bar w-full text-white text-sm font-medium flex items-center justify-center select-none border-b border-white/10 z-30"
        style={{ "-webkit-app-region": "drag" }}
        data-tauri-drag-region
      >
        <p class="z-40 text-white cursor-default text-md pl-2 font-montserrat">Canda</p>
        <div class="flex-grow"></div>
        <div class="pr-2 z-40" id="titlebar-minimize">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-minus pr-2 transform-gpu transition-all hover:stroke-white/60 duration-100"
          >
            <path d="M5 12h14" />
          </svg>
        </div>
        <div id="titlebar-maximize">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-maximize-2 pr-2 transform-gpu transition-all hover:stroke-white/60 duration-100"
          >
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" x2="14" y1="3" y2="10" />
            <line x1="3" x2="10" y1="21" y2="14" />
          </svg>
        </div>
        <div id="titlebar-close">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-x pr-2 transform-gpu transition-all hover:stroke-white/60 duration-100"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </div>
      </div>
      {/* Main content */}
      <div class="main-content flex h-full relative select-none">
        {/* Side menu */}
        <div
          class={`side-menu h-[435px] bg-black/40 border-r-2 border-t-2 border-b-2 border-t-white/40 border-b-white/40 border-r-white/40 rounded-r-xl transition-all duration-300 top-[45px] absolute left-0 overflow-hidden hover:border-r-white/80 hover:border-b-white/80 hover:border-t-white/80 ${
            menuExpanded() ? "max-w-[16.66%] w-full max-h-[435px]" : "max-w-[28px] w-full"
          } flex-shrink-0 whitespace-nowrap`}
        >
          <div
            class="pt-2 pb-2 cursor-pointer hover:border-white/80 rounded-xl transform-gpu"
            onClick={() => setMenuExpanded(!menuExpanded())}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class={`lucide lucide-chevron-right transition-all duration-300 transform-gpu hover:scale-110 ${
                menuExpanded() ? "rotate-180 translate-x-25" : ""
              }`}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
          <ul class={`flex flex-col h-full transition-opacity duration-200 ${menuExpanded() ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {[
              { label: "Open file" },
              { label: "Save file" },
              { label: "iSpy", extraClass: "" },
              { label: "Workspace", extraClass: "border-b" },
              { label: "Settings", extraClass: "mt-46" },
            ].map(({ label, extraClass = "" }) => (
              <li
                class={`p-2 w-full transition-all duration-300 hover:bg-white/10 active:bg-white/0 flex-none transform-gpu flex items-center border-t border-white/40 ${extraClass}`}
              >
                <div class="select-none cursor-pointer ml-2">{label}</div>
              </li>
            ))}
          </ul>
        </div>
        {/* Editor container */}
        <div
          ref={(el) => (editorContainer = el)}
          class={`editor-container select-none flex-grow transition-all duration-300 transform-gpu border-2 border-white/40 hover:border-white/80 ${
            menuExpanded() ? "w-[calc(89%-5rem)]" : "w-[calc(98%-3rem)]"
          }`}
        ></div>
        {/* Button bar */}
        <div
          class={`button-bar flex relative transition-all duration-300 transform-gpu ${
            menuExpanded() ? "w-[calc(89%-5rem)]" : "w-[calc(98%-3rem)]"
          }`}
        >
          <div
            class="rounded-lg pb-1 pt-1 pl-3 pr-3 select-none bg-linear-to-t from-white/0 to-black/40 inset-shadow-sm border-2 border-white/50 transition-all duration-100 w-full"
          >
            <div class="tabs flex space-x-2 items-center h-full">
              {tabs().map((_, index) => (
              <div
                class={`tab relative cursor-pointer pl-2 pr-2 flex-grow text-center border-2 border-white/50 hover:border-white active:scale-95 transition-all duration-200 rounded-md ${
                activeTab() === index ? "border-white/95" : ""
                }`}
                onClick={() => handleTabClick(index)}
              >
                Tab {index + 1}
                <div
                class="close-tab absolute top-0 right-0 mt-1 mr-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setTabs(tabs().filter((_, i) => i !== index));
                  if (activeTab() === index && tabs().length > 1) {
                  setActiveTab(index === 0 ? 0 : index - 1);
                  }
                }}
                >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                </div>
              </div>
              ))}
              <div
              class="add-tab cursor-pointer pl-2 pr-2 flex-grow-0 text-center border-2 border-white/50 hover:border-white active:scale-95 transition-all duration-200 rounded-md"
              onClick={() => setTabs([...tabs(), { content: `-- hello!` }])}
              >
              +
              </div>
            </div>
          </div>
          {/* New Button Bar */}
          <div class="flex ml-[15px] border-2 border-white/50 rounded-lg">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-unplug">
                    <path d="m19 5 3-3"/><path d="m2 22 3-3"/><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/>
                    <path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"/>
                  </svg>
                ),
                extraClass: "duration-200 transition-all"
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-delete">
                    <path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
                    <path d="m12 9 6 6"/><path d="m18 9-6 6"/>
                  </svg>
                ),
                extraClass: "duration-200 transition-all ml-1"
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play">
                    <polygon points="6 3 20 12 6 21 6 3"/>
                  </svg>
                ),
                extraClass: "duration-200 transition-all ml-1"
              }
            ].map(({ icon, extraClass }) => (
              <div
                class={`rounded-lg p-2 select-none cursor-pointer hover:${extraClass} hover:scale-110 active:scale-90 delay-75 transition-all font-montserrat flex items-center justify-center`}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
