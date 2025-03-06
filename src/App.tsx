import { createSignal, onMount, onCleanup, createEffect, batch } from "solid-js";
import { getCurrentWindow } from '@tauri-apps/api/window';
import customTheme from "./themes/customTheme.ts" // FINALLY
import * as Monaco from "monaco-editor";
import { Minus, Maximize2, X, ChevronRight, AlertTriangle, Unplug, Delete, Play } from "lucide-solid";
import "./App.css";
import "./output.css";
import "./input.css";

import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const [editorInstance, setEditorInstance] = createSignal<Monaco.editor.IStandaloneCodeEditor | null>(null);

function App() {
  let editorContainer: HTMLDivElement | null = null;
  const [menuExpanded, setMenuExpanded] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal(0);
  const [tabs, setTabs] = createSignal<{ content: string, closing: boolean, opening: boolean }[]>([ // Add closing state
    { content: "-- hello!", closing: false, opening: false },
  ]);
  const [editorContent, setEditorContent] = createSignal("");
  const [nextTabKey, setNextTabKey] = createSignal(1);
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);

  const showStatusMessage = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000); // Message disappears after 3 seconds
  };


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


  /* ---------------------------------------------- */


  /* Tabs */

  createEffect(() => {
    const instance = editorInstance();
    const currentTabs = tabs();
    const activeIdx = activeTab();
  
    if (instance && currentTabs.length > 0 && activeIdx >= 0 && activeIdx < currentTabs.length) {
      instance.setValue(currentTabs[activeIdx].content);
    }
  });

  const closeTab = (index: number) => {
    if (tabs().length === 1) return;
    const currentTabs = tabs();
    setTabs(
      currentTabs.map((tab, i) => (i === index ? { ...tab, closing: true } : tab))
    );
  
    setTimeout(() => {
      const updatedTabs = currentTabs.filter((_, i) => i !== index);
      setTabs(updatedTabs);
  
      if (activeTab() === index) {
        if (updatedTabs.length > 0) {
          // fixed sum thinking here
          const newActiveTab = index >= updatedTabs.length ? updatedTabs.length - 1 : index;
          setActiveTab(newActiveTab);
  
          // update editorContent and editorInstance
          const newContent = updatedTabs[newActiveTab].content;
          setEditorContent(newContent);
          const instance = editorInstance();
          if (instance) {
            instance.setValue(newContent);
          }
        } else {
          // if no tabs left, clear the editor
          setActiveTab(0);
          setEditorContent("");
          const instance = editorInstance();
          if (instance) {
            instance.setValue("");
          }
        }
      }
    }, 300);
  };
  

  const addTab = () => {
  const instance = editorInstance();
  if (instance) {
    batch(() => {
      // save the content of the current active tab
      const updatedTabs = tabs().map((tab, i) =>
        i === activeTab() ? { ...tab, content: editorContent() } : tab
      );

      // add the new tab
      const newTab = { content: `-- hello!`, closing: false, opening: true, key: nextTabKey() };
      setTabs([...updatedTabs, newTab]);
      setNextTabKey(nextTabKey() + 1);

      // switch to the new tab
      const newActiveTab = updatedTabs.length;
      setActiveTab(newActiveTab);
      setEditorContent(newTab.content);
      instance.setValue(newTab.content);
    });

    setTimeout(() => {
      setTabs(tabs().map(tab => tab.opening ? { ...tab, opening: false } : tab));
    }, 300);
  }
};


/* ---------------------------------------------- */


/* Files */


const openFile = async () => {
  try {
    const filePath = await open({
      filters: [
        { name: 'Lua Files', extensions: ['lua'] },
        { name: 'Text Files', extensions: ['txt'] },
      ],
    });

    if (filePath) {
      const fileContent = await readTextFile(filePath as string);

      const instance = editorInstance();
      if (instance) {
        batch(() => {
          const updatedTabs = tabs().map((tab, i) =>
            i === activeTab() ? { ...tab, content: editorContent() } : tab
          );

          const newTab = { content: fileContent, closing: false, opening: true, key: nextTabKey() };
          setTabs([...updatedTabs, newTab]);
          setNextTabKey(nextTabKey() + 1);

          const newActiveTab = updatedTabs.length;
          setActiveTab(newActiveTab);
          setEditorContent(fileContent);
          instance.setValue(fileContent);
        });

        setTimeout(() => {
          setTabs(tabs().map(tab => tab.opening ? { ...tab, opening: false } : tab));
        }, 300);
      }
    }
  } catch (error) {
    console.error('Error opening file:', error);
  }
};

const saveFile = async () => {
  try {
    const instance = editorInstance();
    if (!instance) {
      console.error('Editor instance not found');
      return;
    }

    const content = instance.getValue();

    const filePath = await save({
      filters: [
        { name: 'Lua Files', extensions: ['lua'] },
        { name: 'Text Files', extensions: ['txt'] },
      ],
    });

    if (filePath) {
      await writeTextFile(filePath, content);
      console.log('File saved successfully:', filePath);
    }
  } catch (error) {
    console.error('Error saving file:', error);
  }
};


  /* ---------------------------------------------- */




  const [settingsOpen, setSettingsOpen] = createSignal(false);


  onMount(async () => {
    await setupTitlebarButtons();

    Monaco.editor.defineTheme("customTheme", customTheme); // FINALLY WORKED
    Monaco.editor.setTheme("customTheme");

    if (editorContainer) {
      const instance = Monaco.editor.create(editorContainer, {
        value: tabs()[activeTab()].content,
        language: "lua",
        fontFamily: "'0xProto'",
        fontSize: 14,
        automaticLayout: true,
        cursorSmoothCaretAnimation: "on",
      });

      setEditorInstance(instance);

      instance.onDidChangeModelContent(() => {
        setEditorContent(instance.getValue()); // update editorContent on changes
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
      batch(() => {
        // Save the content of the current active tab
        setTabs(
          tabs().map((tab, i) =>
            i === activeTab() ? { ...tab, content: editorContent() } : tab
          )
        );
  
        // Switch to the new tab
        setActiveTab(index);
        const newContent = tabs()[index].content;
        setEditorContent(newContent);
        instance.setValue(newContent);
      });
    }
  };

  return (
    <main class="flex flex-col w-full h-full min-h-screen select-none inset-shadow-sm" id="main">


    {settingsOpen() && (
      <div class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50">
        <div class="bg-black p-6 rounded-xl shadow-xl border border-white/20 w-1/2 max-w-lg settings-enter">
          <h2 class="text-lg font-semibold text-white">Settings</h2>
          <p class="text-white/80 mt-2">Modify your preferences here.</p>
          <button 
            class="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            onClick={() => {
              const el = document.querySelector(".settings-enter");
              if (el) {
                el.classList.replace("settings-enter", "settings-exit");
                setTimeout(() => setSettingsOpen(false), 200);
              }
            }}
          >
            Close
          </button>
        </div>
      </div>
    )}

    {/* Status Message */}
    {statusMessage() && (
      <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 status-message-enter cursor-default">
      <div class="bg-black border border-white/30 rounded-lg px-4 py-2 shadow-lg">
        <div class="text-white/90 font-montserrat text-sm flex items-center">
        <AlertTriangle class="mr-2" size={16} strokeWidth={2} color="white" />
        {statusMessage()}
        </div>
      </div>
      </div>
    )}

      {/* Title bar */}


      <div
        class="title-bar w-full text-white text-sm font-medium flex items-center justify-center select-none border-b border-white/10 z-30"
        style={{ "-webkit-app-region": "drag" }}
        data-tauri-drag-region
      >
        <p class="z-40 cursor-default text-md pl-2 font-montserrat text-green-300">Canda</p>
        <div class="flex-grow"></div>
        <div class="pr-2 z-40" id="titlebar-minimize">
        <Minus class="pr-2 transform-gpu transition-all hover:stroke-yellow-300 duration-100" size={24} strokeWidth={1.2} color="white" />
        </div>
        <div id="titlebar-maximize">
        <Maximize2 class="pr-2 transform-gpu transition-all hover:stroke-white/60 duration-100" size={24} strokeWidth={1.2} color="white" />
        </div>
        <div id="titlebar-close">
        <X class="pr-2 transform-gpu transition-all hover:stroke-red-500 duration-100" size={28} strokeWidth={1.2} color="white" />
        </div>
      </div>


      {/* Main content */}


      <div class="main-content flex h-full relative select-none">


        {/* Side menu */}


        <div
          class={`side-menu h-[435px] bg-zinc-900 shadow-black/80 shadow-md border-r border-t border-b hover:border-green-400 border-t-zinc-700 border-b-zinc-700 border-r-zinc-700 rounded-r-md transition-all duration-300 top-[35px] absolute left-0 overflow-hidden ${
            menuExpanded() ? "max-w-[16.66%] w-full ml-[5px] rounded-l-[5px] border-l-zinc-700 border-l" : "max-w-[28px] w-full border-l-zinc-700"
          } flex-shrink-0 whitespace-nowrap`}
          style={{ height: "calc(100% - 40px)" }}
        >
          <div
            class="pt-2 pb-2 cursor-pointer hover:border-white/80 rounded-xl transform-gpu"
            onClick={() => setMenuExpanded(!menuExpanded())}
          >
            <ChevronRight class={`transition-all duration-300 transform-gpu hover:scale-110 ${menuExpanded() ? "rotate-180 translate-x-25" : ""}`} size={24} strokeWidth={1.2} />
          </div>
          <ul class={`flex flex-col h-full transition-opacity duration-200 ${menuExpanded() ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {[
              { label: "Open file", action: openFile },
              { label: "Save file", action: saveFile },
              { label: "iSpy" },
              { label: "Workspace", extraClass: "border-b" },
              { label: "Settings", extraClass: "mt-52", action: () => setSettingsOpen(true) },
            ].map(({ label, action, extraClass = "" }) => (
              <li
                class={`p-2 w-full transition-all duration-300 hover:bg-white/10 active:bg-white/0 flex-none transform-gpu flex items-center border-t border-white/40 ${extraClass}`}
                onClick={action ? action : undefined}>
                <div class="select-none cursor-pointer ml-2">{label}</div>
              </li>
            ))}
          </ul>
        </div>


        {/* Editor container */}

            
        <div
          ref={(el) => (editorContainer = el)}
          class={`editor-container hover:border-green-400 rounded-b-md shadow-black shadow-md rounded-[5px] select-none flex-grow transition-all duration-300 transform-gpu border border-zinc-700 ${
            menuExpanded() ? "w-[calc(91%-5rem)]" : "w-[calc(97.2%-1rem)]"
          }`}
        ></div>


        {/* Bottom bar */}


        <div
          class={`button-bar flex relative transition-all duration-300 transform-gpu ${
            menuExpanded() ? "w-[calc(91%-5rem)] ml-2" : "w-[calc(97.2%-1rem)]"
          }`}
        >
          <div
            class="rounded-md pb-1 pt-1 pl-3 pr-2 select-none bg-zinc-900 shadow-black/80 shadow-md inset-shadow-sm border border-zinc-700 transition-all duration-100 w-full"
          >


            {/* Tab bar */}


            <div class="tabs flex space-x-2 items-center h-full">
            {tabs().map((tab, index) => (
              <div
              class={`tab relative cursor-pointer pl-2 pr-2 flex-grow text-center border border-zinc-700 rounded-[5px] hover:border-green-400/80 ${
                activeTab() === index ? "border-green-400/95 scale-102 bg-zinc-800" : ""
              } ${tab.closing ? 'tab-closing' : ''} ${tab.opening ? 'tab-opening' : ''}`}
              onClick={() => handleTabClick(index)}
              >
              Tab {index + 1}
              <div
                class="close-tab absolute top-0 right-0 mt-1 mr-1 cursor-pointer"
                onClick={(e) => {
                e.stopPropagation();
                closeTab(index);
                }}
              >
                <X class="transform-gpu transition-all hover:stroke-white/60 duration-100" size={16} strokeWidth={1.5} color="white" />
              </div>
              </div>
            ))}
              <div
              class="add-tab cursor-pointer pl-2 pr-2 ml-1 flex-grow-0 text-center border border-zinc-700 hover:border-green-400 active:scale-95 transition-all duration-200 rounded-sm"
              onClick={addTab}
              >
              +
              </div>
            </div>
          </div>


          {/* New Button Bar */}


            <div class="flex ml-[5px] border bg-zinc-900 rounded-[5px] border-zinc-700  shadow-black/80 shadow-md">
            {[
              {
              icon: <Unplug size={24} color="#ffffff" strokeWidth={1.2} class="hover:stroke-green-400 transition-all duration-150 delay-75" />,
              extraClass: "duration-200 duration-150 hover:scale-110 active:scale-90 delay-75 transition-all",
              action: () => showStatusMessage("Roblox not found...")
              },
              {
              icon: <Delete size={24} color="#ffffff" strokeWidth={1.2} class="hover:stroke-green-400 transition-all duration-150 delay-75" />,
              extraClass: "ml-1 duration-150 hover:scale-110 hover:stroke-green-400 active:scale-90 delay-75 transition-all"
              },
              {
              icon: <Play size={24} color="#ffffff" strokeWidth={1.2} class="hover:stroke-green-400 transition-all duration-150 delay-75" />,
              extraClass: "ml-1 duration-150 hover:scale-110 active:scale-90 delay-75 transition-all"
              }
            ].map(({ icon, extraClass, action }) => (
              <div
              class={`rounded-lg p-2 select-none cursor-pointer hover:${extraClass} transition-all font-montserrat flex items-center justify-center`}
              onClick={action}
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
