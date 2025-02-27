import { createSignal, onMount, onCleanup, createEffect, batch } from "solid-js";
import { getCurrentWindow } from '@tauri-apps/api/window';
import customTheme from "./themes/customTheme.ts" // FINALLY
import * as Monaco from "monaco-editor";
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
              { label: "Open file", action: openFile },
              { label: "Save file", action: saveFile },
              { label: "iSpy" },
              { label: "Workspace", extraClass: "border-b" },
              { label: "Settings", extraClass: "mt-46" },
            ].map(({ label, action, extraClass = "" }) => (
              <li
                class={`p-2 w-full transition-all duration-300 hover:bg-white/10 active:bg-white/0 flex-none transform-gpu flex items-center border-t border-white/40 ${extraClass}`}
                onClick={action}>
                <div class="select-none cursor-pointer ml-2">{label}</div>
              </li>
            ))}
          </ul>
        </div>


        {/* Editor container */}


        <div
          ref={(el) => (editorContainer = el)}
          class={`editor-container rounded-xl select-none flex-grow transition-all duration-300 transform-gpu border-2 border-white/40 hover:border-white/80 ${
            menuExpanded() ? "w-[calc(89%-5rem)]" : "w-[calc(98%-3rem)]"
          }`}
        ></div>


        {/* Bottom bar */}


        <div
          class={`button-bar flex relative transition-all duration-300 transform-gpu ${
            menuExpanded() ? "w-[calc(89%-5rem)]" : "w-[calc(98%-3rem)]"
          }`}
        >
          <div
            class="rounded-xl pb-1 pt-1 pl-3 pr-2 select-none bg-linear-to-t from-white/0 to-black/40 inset-shadow-sm border-2 border-white/50 transition-all duration-100 w-full"
          >


            {/* Tab bar */}


            <div class="tabs flex space-x-2 items-center h-full">
            {tabs().map((tab, index) => (
              <div
              class={`tab relative cursor-pointer pl-2 pr-2 flex-grow text-center border-2 border-white/50 hover:border-white rounded-lg ${
                activeTab() === index ? "border-white/95 scale-102" : ""
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
                class="lucide lucide-x transition-all hover:stroke-white/50 duration-200"
                >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
                </svg>
              </div>
              </div>
            ))}
              <div
              class="add-tab cursor-pointer pl-2 pr-2 ml-1 flex-grow-0 text-center border-2 border-white/50 hover:border-white active:scale-95 transition-all duration-200 rounded-md"
              onClick={addTab}
              >
              +
              </div>
            </div>
          </div>


          {/* New Button Bar */}


          <div class="flex ml-[15px] border-2 border-white/50 rounded-xl">
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
