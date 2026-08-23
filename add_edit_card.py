import re

with open('src/components/SubjectDetailsModal.tsx', 'r') as f:
    content = f.read()

# We need to replace:
old_map = """            filteredCards.map((card, idx) => (
              <div
                key={card.id}
                className="p-3.5 sm:p-4 bg-stone-50/70 dark:bg-stone-800/50 hover:bg-stone-100/70 dark:hover:bg-stone-800 border border-stone-200/70 dark:border-stone-750 rounded-2xl transition-all flex items-start justify-between gap-3 sm:gap-4 text-xs"
              >"""

new_map = """            filteredCards.map((card, idx) => (
              editingCard?.id === card.id ? (
                <div
                  key={card.id}
                  className="p-3.5 sm:p-4 bg-white dark:bg-stone-800 border border-[var(--theme-accent)] rounded-2xl transition-all shadow-sm space-y-3"
                >
                  <form onSubmit={handleUpdateCard} className="space-y-3 text-xs">
                    <input
                      type="text"
                      value={editingCard.front}
                      onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                      className="w-full font-extrabold text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
                      placeholder="Front of card (Question)"
                      autoFocus
                    />
                    <textarea
                      value={editingCard.back}
                      onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                      className="w-full text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent min-h-[60px]"
                      placeholder="Back of card (Answer)"
                    />
                    <input
                      type="text"
                      value={editingCard.hint || ''}
                      onChange={(e) => setEditingCard({ ...editingCard, hint: e.target.value })}
                      className="w-full text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
                      placeholder="Hint (optional)"
                    />
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingCard(null)}
                        className="px-3 py-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!editingCard.front.trim() || !editingCard.back.trim()}
                        className="px-4 py-1.5 rounded-lg bg-[var(--theme-accent)] text-white font-bold hover:bg-[var(--theme-secondary)] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
              <div
                key={card.id}
                className="p-3.5 sm:p-4 bg-stone-50/70 dark:bg-stone-800/50 hover:bg-stone-100/70 dark:hover:bg-stone-800 border border-stone-200/70 dark:border-stone-750 rounded-2xl transition-all flex items-start justify-between gap-3 sm:gap-4 text-xs"
              >"""

content = content.replace(old_map, new_map)

# We also need to close the ternary for the card mapping
old_close = """                </div>
              </div>
            ))
          )}
        </div>"""

new_close = """                </div>
              </div>
              )
            ))
          )}
        </div>"""

content = content.replace(old_close, new_close)

with open('src/components/SubjectDetailsModal.tsx', 'w') as f:
    f.write(content)
print("Done")
