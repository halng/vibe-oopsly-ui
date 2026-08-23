import re

with open('src/components/LibraryShelvesView.tsx', 'r') as f:
    content = f.read()

# 1. Add state for dragging
state_addition = """  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [dragOverShelfId, setDragOverShelfId] = useState<string | null>(null);"""
content = content.replace(
    "const [globalSubjectSearchQuery, setGlobalSubjectSearchQuery] = useState('');",
    "const [globalSubjectSearchQuery, setGlobalSubjectSearchQuery] = useState('');\n" + state_addition
)

# 2. Add draggable props to Subject Card
old_subject_card_start = """      return (
        <div
          key={subject.id}
          id={`subject-card-${subject.id}`}
          data-testid={`subject-card-${subject.id}`}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
        >"""

new_subject_card_start = """      return (
        <div
          key={subject.id}
          id={`subject-card-${subject.id}`}
          data-testid={`subject-card-${subject.id}`}
          draggable
          onDragStart={(e) => {
            setDraggedSubjectId(subject.id);
            e.dataTransfer.setData('subjectId', subject.id);
          }}
          onDragEnd={() => {
            setDraggedSubjectId(null);
            setDragOverShelfId(null);
          }}
          className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group ${draggedSubjectId === subject.id ? 'opacity-50 scale-95' : ''}`}
        >"""

content = content.replace(old_subject_card_start, new_subject_card_start)

# 3. Add drag props to Shelf Card
old_shelf_card_start = """            return (
              <div
                key={shelf.id}
                id={`shelf-card-${shelf.id}`}
                data-testid={`shelf-card-${shelf.id}`}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-[var(--theme-accent)]/50 relative cursor-pointer"
                onClick={() => onSelectShelf(shelf.id)}
              >"""

new_shelf_card_start = """            return (
              <div
                key={shelf.id}
                id={`shelf-card-${shelf.id}`}
                data-testid={`shelf-card-${shelf.id}`}
                onDragOver={(e) => {
                  if (draggedSubjectId) {
                    e.preventDefault();
                    setDragOverShelfId(shelf.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverShelfId === shelf.id) setDragOverShelfId(null);
                }}
                onDrop={async (e) => {
                  if (draggedSubjectId) {
                    e.preventDefault();
                    const subjectId = e.dataTransfer.getData('subjectId');
                    setDraggedSubjectId(null);
                    setDragOverShelfId(null);
                    if (subjectId) {
                      try {
                        await ApiService.updateSubject(subjectId, { shelfId: shelf.id });
                        if (onRefreshData) onRefreshData();
                      } catch(err) {
                        console.error(err);
                      }
                    }
                  }
                }}
                className={`bg-white dark:bg-stone-900 rounded-3xl border shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group relative cursor-pointer ${
                  dragOverShelfId === shelf.id 
                    ? 'border-[var(--theme-accent)] ring-4 ring-[var(--theme-accent)]/30 scale-105 z-10' 
                    : 'border-stone-200/80 dark:border-stone-800 hover:border-[var(--theme-accent)]/50'
                }`}
                onClick={() => onSelectShelf(shelf.id)}
              >"""

content = content.replace(old_shelf_card_start, new_shelf_card_start)

# 4. Add floating drop zone overlay when dragging
# We will append it right before the last closing div of the component
floating_overlay = """
      {/* Floating Drag & Drop Overlay */}
      {draggedSubjectId && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-50 flex flex-col items-center animate-slide-up shadow-2xl">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
            Drop subject to move to a shelf
          </h3>
          <div className="flex gap-4 overflow-x-auto max-w-4xl w-full pb-2 px-4 justify-center items-center">
            {shelves.filter(s => s.id !== activeShelf?.id).map(shelf => (
              <div
                key={shelf.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverShelfId(shelf.id);
                }}
                onDragLeave={() => {
                  if (dragOverShelfId === shelf.id) setDragOverShelfId(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const subjectId = e.dataTransfer.getData('subjectId');
                  setDraggedSubjectId(null);
                  setDragOverShelfId(null);
                  if (subjectId) {
                    try {
                      await ApiService.updateSubject(subjectId, { shelfId: shelf.id });
                      if (onRefreshData) onRefreshData();
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all min-w-[120px] max-w-[140px] ${
                  dragOverShelfId === shelf.id 
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 scale-110 shadow-lg' 
                    : 'border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: shelf.color || 'var(--theme-accent)' }}>
                  <Folder className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center line-clamp-1 w-full text-stone-700 dark:text-stone-300">{shelf.name}</span>
              </div>
            ))}
            {shelves.filter(s => s.id !== activeShelf?.id).length === 0 && (
              <span className="text-sm font-semibold text-stone-500">No other shelves available.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};"""

content = re.sub(r'    </div>\s*<Modal', r'    </div>\n      <Modal', content) # just in case
content = re.sub(r'    </div>\s*<ImportCardsModal', r'    </div>\n      <ImportCardsModal', content) 
content = re.sub(r'    </div>\s*\);\s*};\s*$', floating_overlay, content)

with open('src/components/LibraryShelvesView.tsx', 'w') as f:
    f.write(content)

print("Done refactoring LibraryShelvesView with drag & drop")
