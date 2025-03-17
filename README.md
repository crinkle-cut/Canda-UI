# Canda Editor Interface Documentation  
**Version 1.0**  

---

## Table of Contents  
1. [Adding Buttons to Full-Ass-Bar](#adding-buttons)  
2. [Button Configuration Standards](#button-config)  
3. [Tab Management System](#tab-system)  
4. [Status Message System](#status-system)  
5. [Common Pitfalls](#pitfalls)  

---

<a name="adding-buttons"></a>  
## 1. Adding Buttons to Full-Ass-Bar  

### Basic Structure  
Buttons exist in two sections of the full-ass-bar:  
```tsx
<div class="button-container"> // Left-aligned buttons (Execute/Clear group)
<div class="bar">              // Right-aligned buttons (File operations)
```

### Implementation Steps  
1. **Choose button group** based on functionality:  
   - Left group for editor actions  
   - Right group for file operations  

2. Add new button template:  
```tsx
// Example for left group
<div class="w-full h-full rounded-[4px] border border-white/50 bg-white/10 p-[1px] shadow-md shadow-black/60 transition-all duration-250 hover:scale-105 active:scale-95">
  <button 
    class="w-full h-full flex items-center justify-center rounded-[4px] transition cursor-pointer"
    onClick={/* Your handler */}
  >
    <YourIcon size={22} strokeWidth={1.2} />
  </button>
</div>
```

3. **Icon Requirements**  
- Import from `lucide-solid`  
- Maintain 22px size + 1.2 stroke width  
```tsx
import { YourIcon } from "lucide-solid";
```

---

<a name="button-config"></a>  
## 2. Button Pre-Configuration  

### Required Classes  
```css
/* Container */
rounded-[4px] (or edge variants)
border border-white/50 
bg-white/10 
p-[1px] 
shadow-md shadow-black/60 
transition-all duration-250 
hover:scale-105 
active:scale-95

/* Button */
w-full h-full 
flex items-center justify-center 
rounded-[4px] (match container)
transition cursor-pointer
```

### Animation Rules  
- **Hover:** 5% scale increase  
- **Click:** 5% scale decrease  
- **Transitions:** 250ms duration for all properties  

---

<a name="tab-system"></a>  
## 3. Tab Management System  

### Key Functions  
```ts
addTab()        // Creates new tab with default content
closeTab(index) // Handles animations and content cleanup
handleTabClick  // Manages tab switching logic
```

### Tab Object Structure  
```ts
{
  content: string     // Editor content
  closing: boolean    // Closing animation flag
  opening: boolean    // Opening animation flag
  key?: number        // Auto-generated unique ID
}
```

### Adding Tab-Related Features  
1. **Modify default content** in `addTab()`:  
```ts
const newTab = { content: `-- YOUR DEFAULT CONTENT`, ... }
```

2. **Adjust animation timing** (300ms in setTimeout calls)  

---

<a name="status-system"></a>  
## 4. Status Message System  

### Usage Example  
```tsx
showStatusMessage("Your message here");
```

### Implementation Notes  
- Auto-dismisses after 3 seconds  
- Uses fixed positioning above full-ass-bar  
- Includes warning triangle icon automatically  

---

<a name="pitfalls"></a>  
## 5. Common Pitfalls  

### ⚠️ Layout Breakers  
- **Missing container div hierarchy** - Always wrap buttons in the exact div structure shown in existing implementations  
- **Incorrect z-index** - Titlebar uses z-30, status messages z-50, settings modal z-50  

### ⚠️ State Management  
- **Direct DOM manipulation** - Use Solid.js signals instead  
- **Missing batch()** - When making multiple state updates that affect editor content  

### ⚠️ Animation Conflicts  
- **Multiple class changes** - Use classList prop instead of className when toggling animated elements  
- **Timing mismatches** - Keep animation durations matching between TS (setTimeout) and CSS  

---
