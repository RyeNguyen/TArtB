# TArtB - Art New Tab Chrome Extension

A Chrome extension that replaces your new tab page with stunning artwork from world-renowned museums.

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 7
- **State:** Zustand 5 (with Chrome storage persistence)
- **Data Fetching:** TanStack React Query 5
- **Backend:** Firebase Firestore + Cloud Functions
- **Styling:** Tailwind CSS 4 + Framer Motion
- **Date/Calendar:** date-fns + react-day-picker v9
- **Popover/Positioning:** @floating-ui/react
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **i18n:** i18next (EN, VI)
- **Extension:** Manifest v3, new tab override

## Project Structure

```
src/
├── App.tsx                    # Main app, language sync, dock + sidebar wiring
├── main.tsx                   # React Query setup, i18n import
├── i18n.ts                    # i18next config
├── components/
│   ├── Artwork/
│   │   └── InteractiveArtwork.tsx  # Canvas-based image with dissolve effect
│   ├── icons/                 # Grip (drag handle icon)
│   ├── atoms/                 # GlassButton, Glass, Switch, Selector, Clock, Typography, WidgetWrapper, Popover, DatePicker, Dropdown
│   ├── molecules/             # ArtworkInfo, MenuCategories, DockStation, ToDo (with drag-drop components)
│   └── organisms/             # Sidebar (settings panel), DynamicFieldRenderer
├── stores/
│   ├── artworkStore.ts        # Current artwork state
│   ├── settingsStore.ts       # Widget + app settings with Chrome storage middleware
│   └── todoStore.ts           # Task lists & tasks with Chrome storage persistence
├── services/
│   ├── api/
│   │   ├── artInstituteApi.ts # Chicago Art Institute API
│   │   ├── metMuseumApi.ts    # Metropolitan Museum API
│   │   └── wikiArtApi.ts      # WikiArt API (needs auth)
│   └── firebase/
│       └── firestoreService.ts # Primary data source
├── hooks/
│   ├── useArtwork.ts          # Main hook: Firestore → API fallback chain
│   └── useToDo.ts             # ToDo state: input, priority, deadline, task CRUD, drag-drop reordering
├── types/
│   └── settings.ts            # WidgetId enum, UserSettings, widget state interfaces
├── constants/
│   ├── common.ts              # Enums: TimeFormat, ClockType, Language, FieldType, TaskPriorityType, TaskSortBy, TaskGroupBy
│   ├── widgets.ts             # WIDGET_REGISTRY - widget metadata (icons, names, categories)
│   ├── toDoConfig.ts          # PRIORITY_CONFIG - priority colors/labels
│   └── settingConfig.ts       # Settings UI structure by category
├── locales/                   # en.json, vi.json
└── animations/                # Framer Motion variants
```

## Key Patterns

### Widget System (macOS-style)
Each widget has two states:
- **enabled:** Widget appears in dock (red dot disables → removes from dock)
- **visible:** Widget appears on screen (yellow dot minimizes → stays in dock, dimmed)

```typescript
// Widget IDs
enum WidgetId {
  CLOCK = "clock",
  DATE = "date",
  ARTWORK_INFO = "artworkInfo",
  TODO = "toDo",
}

// Settings structure
interface UserSettings {
  widgets: {
    clock: { enabled: boolean, visible: boolean, type: ClockType, timeFormat: TimeFormat },
    date: { enabled: boolean, visible: boolean },
    artworkInfo: { enabled: boolean, visible: boolean },
  },
  artwork: { museum: string, changeInterval: number },
  app: { language: Language },
}
```

### DockStation Behavior
- Shows icons for **enabled** widgets only
- Dimmed icons for **minimized** widgets (enabled but not visible)
- **Click:** Toggle `visible` state
- **Long press (400ms):** Open settings for that widget's category

### WidgetWrapper
Provides the glass-morphism container with:
- 3D tilt effect on hover
- Yellow dot (minimize) and red dot (close) buttons
- Can connect directly to store via `widgetId` prop

### Data Fetching (useArtwork hook)
```
Firestore → Selected Museum API → Random Museum → Met Museum (fallback)
```
- React Query handles caching (based on changeInterval)
- Auto-refetch based on `settings.artwork.changeInterval`
- Progressive image loading (small → full)

### Settings Store Actions
```typescript
toggleWidgetVisible(widgetId)  // Click on dock icon
minimizeWidget(widgetId)       // Yellow dot
closeWidget(widgetId)          // Red dot
setWidgetEnabled(widgetId, enabled)  // From settings panel
restoreWidget(widgetId)        // Make visible again
```

### Popover System
Shared popover component (`atoms/Popover.tsx`) using @floating-ui/react:
- **Popover**: Root component, manages open state + positioning
- **PopoverTrigger**: Wraps the element that opens the popover
- **PopoverContent**: Portal-rendered content with Glass styling
- Auto-positioning with `flip`, `shift`, `offset` middleware
- Click-outside and Escape key dismissal via `useDismiss`
- Supports controlled (`open`/`onOpenChange`) or uncontrolled state

Used by: `Dropdown`, `DatePicker`, and future popovers (tags, task detail, etc.)

### ToDo Widget
- **ToDoForm** (`molecules/toDo/toDoForm.tsx`): Task input with priority dropdown, date picker, and tags
- **ToDoList** (`molecules/toDo/toDoList.tsx`): Task list with drag-drop support via @dnd-kit
- **DatePicker** (`atoms/DatePicker.tsx`): Calendar popup wrapping react-day-picker + Popover
  - Quick-select buttons: Today, Tomorrow
  - Selecting already-selected date clears it
  - Locale-aware via date-fns locales
  - Disables past dates
- **useToDo hook**: Manages input state (title, priority, deadline), task filtering/grouping/sorting, drag-drop reordering
- **todoStore**: Zustand store with task lists, tasks, CRUD operations, persisted via Chrome storage

### Task Drag & Drop
Built with @dnd-kit for task reordering within and across groups:

**Components:**
- `SortableTaskItem`: Wraps TaskItem with `useSortable` hook
- `DroppableGroup`: Group container with `useDroppable` + separate `SortableContext`
- `TaskDragOverlay`: Visual feedback during drag (currently disabled)

**Sort Behavior:**
| SortBy | Drag Behavior |
|--------|---------------|
| MANUAL | Full control via `order` field |
| PRIORITY | Reorder within priority; cross-group changes `task.priority` |
| DUE_DATE | Reorder within deadline status; drop to "No Date" clears deadline |
| DATE/TITLE | Auto-switches to MANUAL on drag |

**Cross-Group Drag Effects:**
- Drag to priority group → updates `task.priority`
- Drag to "No Date" group → clears `task.deadline`
- Drag to/from Completed → toggles `task.isCompleted`

**Key Implementation Details:**
- Separate `SortableContext` per group to isolate reorder animations
- Custom collision detection using `pointerWithin` for accurate group targeting
- `disableSortAnimation` prop prevents swap visuals during cross-group drags
- Fractional ordering (insert between existing orders) minimizes order recalculation

### Component Styling
- Glass-morphism: `backdrop-blur-sm bg-gray-400/25 border-white/10`
- Z-index layers: 0 (blur bg), 1 (overlay), 2 (canvas), 10 (widgets), 50 (sidebar)
- Transitions: `transition-all duration-200`

## Environment Variables

```
VITE_WIKIART_ACCESS_CODE=<access_code>
VITE_WIKIART_SECRET_CODE=<secret_code>
```

Note: Firebase config is currently hardcoded in `firestoreService.ts`.

## Commands

```bash
npm run dev      # Vite dev server (CRX plugin disabled)
npm run build    # Build to dist/
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Adding Features

**New Widget:**
1. Add to `WidgetId` enum in `types/settings.ts`
2. Create widget state interface extending `BaseWidgetState`
3. Add to `WidgetStates` interface and `DEFAULT_SETTINGS`
4. Register in `WIDGET_REGISTRY` in `constants/widgets.ts`
5. Create widget component (check `enabled && visible`)
6. Add settings fields to `settingConfig.ts`

**New Setting:**
1. Add to appropriate section in `UserSettings` interface
2. Add default in `DEFAULT_SETTINGS`
3. Add field config in `settingConfig.ts` (use dot notation: `widgets.clock.enabled`)
4. Add translation keys in `locales/*.json`

**New Museum API:**
1. Create service in `services/api/`
2. Add museum type to `Artwork` interface
3. Update fallback chain in `useArtwork.ts`
4. Add to `ArtworkSettings.museum` type

**New Language:**
1. Create `locales/<lang>.json`
2. Add to `i18n.ts` resources
3. Add to `Language` enum in `constants/common.ts`
4. Add selector option in `settingConfig.ts`

## Architecture Notes

- No background/content scripts - pure new tab UI
- InteractiveArtwork uses HTML5 Canvas with grid-based dissolve effect
- Mouse tracking with physics (velocity, friction, ease)
- Animation stops when idle for performance
- 3-level image URL fallbacks for reliability
- Settings migrate automatically from legacy flat structure to new grouped structure
