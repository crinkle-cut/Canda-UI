import { createSignal, onMount, onCleanup, createEffect, batch } from "solid-js";
import { getCurrentWindow } from '@tauri-apps/api/window';
import customTheme from "./themes/customTheme.ts" // FINALLY
import * as Monaco from "monaco-editor";
import { Minus, Maximize2, X, AlertTriangle, Unplug, Delete, Play, Plus, Folder, Save, Bolt } from "lucide-solid";
import "./App.css";
import "./output.css";
import "./input.css";

import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const [editorInstance, setEditorInstance] = createSignal<Monaco.editor.IStandaloneCodeEditor | null>(null);

function App() {
  let editorContainer: HTMLDivElement | null = null;
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
      setTabs(tabs().map(tab => tab.opening ? { ...tab, opening: false } : tab)); // bro ts code is ass idek why i made this shit like this 💔😭
    }, 300);
  }
};


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
    <main class="flex flex-col w-full h-screen max-h-screen select-none inset-shadow-sm" id="main">
      <div class="flex flex-col w-full h-screen max-h-screen select-none inset-shadow-sm rounded-[15px] border-1 border-border1/80 bg-white/10">
      {settingsOpen() && (
        <div class="fixed inset-0 flex items-center justify-center bg-background1/70 backdrop-blur-md z-50">
        <div class="bg-background3 p-6 rounded-xl shadow-xl border border-white/20 w-1/2 max-w-lg settings-enter">
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
      {statusMessage() && (
        <div class="fixed bottom-4 left-[85.3%] min-w-fit transform -translate-x-1/2 z-50 status-message-enter cursor-default">
        <div class="bg-black border border-white/30 rounded-lg px-4 py-2 shadow-lg">
          <div class="text-white/90 font-montserrat text-sm flex items-center">
          <AlertTriangle class="mr-2" size={16} strokeWidth={2} color="white" />
          {statusMessage()}
          </div>
        </div>
        </div>
      )}
      <div
        class="title-bar bg-black/30 rounded-full text-white text-sm font-medium flex items-center justify-center select-none z-30 transition-all active:scale-99"
        style={{ "-webkit-app-region": "drag" }}
        data-tauri-drag-region
      >
        <p class="z-40 cursor-default text-md ml-3 font-montserrat text-white">Canda</p>
        <div class="flex-grow"></div>
        <div class="pr-2 z-40" id="titlebar-minimize">
        <Minus class="pr-2 transform-gpu transition-all hover:stroke-yellow-300 duration-100" size={24} strokeWidth={1.2} color="white" />
        </div>
        <div id="titlebar-maximize">
        <Maximize2 class="pr-2 transform-gpu transition-all hover:stroke-white/60 duration-100" size={24} strokeWidth={1.2} color="white" />
        </div>
        <div id="titlebar-close"></div>
        <div id="titlebar-close">
          <X class="pr-2 transform-gpu transition-all hover:stroke-red-500 duration-100" size={28} strokeWidth={1.2} color="white" />
        </div>
      </div>

      <div class="main-content mt-10 mr-[5px] ml-[5px] flex flex-col relative select-none rounded-[10px] bg-white/0">
        <div class="content flex flex-col w-full h-full rounded-[10px] min-h-0">

        <div class="editor-1 relative flex-grow overflow-hidden rounded-b-[8px] rounded-t-[8px] select-none flex flex-col min-h-0">

        <div ref={(el) => (editorContainer = el)} class="flex-grow overflow-hidden rounded-b-[6px] rounded-t-[6px]"></div>
        </div>
        </div>
      </div>
      <div class="full-ass-bar flex flex-row items-center m-auto mb-[5px] rounded-full bg-black/30">
      <div class="flex max-h-12 justify-center items-center space-x-3 z-10 transition-all duration-300">
            <div class="button-container p-1.5 flex w-40 h-12 items-center space-x-1 transition-all duration-300">
              <div class="w-full h-full rounded-l-[100px] rounded-r-[20px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 hover:scale-105 active:scale-95">
                <button class="w-full h-full flex items-center justify-center rounded-l-[100px] rounded-r-[20px] transition cursor-pointer" onClick={() => showStatusMessage("Roblox not found...")}>
                  <Unplug size={22} strokeWidth={1.2} />
                </button>
              </div>
                <div class="w-full h-full rounded-[4px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 hover:scale-105 active:scale-95">
                <button
                  class="w-full h-full flex items-center justify-center rounded-[4px] transition cursor-pointer"
                  onClick={() => {
                  const instance = editorInstance();
                  if (instance) {
                    instance.setValue("");
                    setEditorContent("");
                  }
                  }}
                >
                  <Delete size={22} strokeWidth={1.2} />
                </button>
                </div>
              <div class="w-full h-full rounded-r-[100px] rounded-l-[20px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 hover:scale-105 active:scale-95">
                <button class="w-full h-full flex items-center justify-center rounded-r-[100px] rounded-l-[20px] transition cursor-pointer">
                  <Play size={22} strokeWidth={1.2} />
                </button>
              </div>
            </div>
          </div>
            <div
            class="bar flex w-full transition-all duration-300"
            >
            <div
              classList={{
              'min-w-40 flex h-12 space-x-1 p-1.5 transition-all duration-300': true,
              }}
            >
              <div class="w-full h-full rounded-l-[100px] rounded-r-[20px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 hover:scale-105 active:scale-95">
              <button class="w-full h-full flex items-center justify-center rounded-l-[100px] rounded-r-[20px] transition cursor-pointer" onClick={openFile}>
                <Folder size={22} strokeWidth={1.2} />
              </button>
              </div>
              <div class="w-full h-full rounded-r-[3px] rounded-l-[3px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 hover:scale-105 active:scale-95">
              <button class="w-full h-full flex items-center justify-center rounded-r-[3px] rounded-l-[3px] transition cursor-pointer" onClick={saveFile}>
                <Save size={22} strokeWidth={1.2} />
              </button>
              </div>
              <div class="w-full h-full rounded-r-[100px] rounded-l-[20px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-300 hover:scale-105 active:scale-95">
              <button class="w-full h-full flex items-center justify-center rounded-r-[100px] rounded-l-[20px] transition cursor-pointer" onClick={() => setSettingsOpen(true)}>
                <Bolt size={22} strokeWidth={1.2} />
              </button>
              </div>
            </div>

            <div
              classList={{
              'w-full flex h-12 space-x-4 gap-[4px] p-1.5 pl-1.5 transition-all duration-300': true,
              }}
            >
              {tabs().map((tab, index) => (
              <div
                classList={{
                'tab relative cursor-pointer w-full text-center rounded-[5px] transition-all duration-200': true,
                '': activeTab() === index,
                'tab-closing': tab.closing,
                'tab-opening': tab.opening,
                }}
                style={{
                'border-radius': index === 0 ? '100px 20px 20px 100px' : '5px',
                }}
                onClick={() => handleTabClick(index)}
              >
                <div
                classList={{
                  'w-full h-full border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 active:scale-95': true,
                  'rounded-l-[100px] rounded-r-[20px]': index === 0,
                  'rounded-[4px]': index !== 0,
                }}
                >
                <button
                  classList={{
                  'w-full h-full flex items-center justify-center transition cursor-pointer': true,
                  'rounded-l-[100px] rounded-r-[20px]': index === 0,
                  'rounded-[4px]': index !== 0,
                  }}
                >
                  <text class="text-white">Tab {index + 1}</text>
                </button>
                </div>
                <div
                class="close-tab absolute top-0 right-0 mt-2 mr-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(index);
                }}
                >
                <X size={20} strokeWidth={1.2} />
                </div>
              </div>
              ))}
              <div
              class="add-tab cursor-pointer flex-grow-0 text-center active:scale-95 transition-all duration-200 rounded-r-[100px] rounded-l-[20px]"
              onClick={addTab}
              >
              <div class="w-10 h-full rounded-r-[100px] rounded-l-[20px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 hover:scale-105 active:scale-95">
                <button class="w-full h-full flex items-center justify-center rounded-r-[100px] rounded-l-[20px] transition cursor-pointer">
                <Plus size={20} strokeWidth={1.2} />
                </button>
              </div>
              </div>
            </div>
            </div>
          </div>
      </div>
    </main>
  );
}

export default App;
