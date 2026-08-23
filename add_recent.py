import re

with open('src/components/LibraryShelvesView.tsx', 'r') as f:
    content = f.read()

recent_memo = """  const recentSubjects = useMemo(() => {
    return subjects
      .filter((s) => !s.isDeleted)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [subjects]);
"""

# Insert the memo
content = content.replace(
    "  const activeShelfTags = useMemo(() => {",
    recent_memo + "\n  const activeShelfTags = useMemo(() => {"
)

recent_ui = """
      {/* Recent Activity */}
      {!globalSubjectSearchQuery.trim() && !shelfSearchQuery.trim() && recentSubjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentSubjects.map(renderSubjectCard)}
          </div>
        </div>
      )}
"""

# Insert the recent UI after the Header & Main Actions but before Global Due Reminder
content = content.replace(
    "      {/* Global Due Reminder */}",
    recent_ui + "\n      {/* Global Due Reminder */}"
)

with open('src/components/LibraryShelvesView.tsx', 'w') as f:
    f.write(content)
print("Done")
