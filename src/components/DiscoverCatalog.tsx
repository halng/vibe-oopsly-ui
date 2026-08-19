import React, { useState, useEffect } from 'react';
import {
  Compass,
  Download,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  Folder,
  Eye,
} from 'lucide-react';
import { Subject, Shelf, Card } from '../types';
import { ApiService } from '../services/api';
import { CloneSubjectModal } from './CloneSubjectModal';

interface DiscoverCatalogProps {
  shelves: Shelf[];
  onCloneSuccess: () => void;
  onCreateNewShelf?: (data: { name: string; description?: string; color?: string }) => Promise<Shelf | null>;
}

export const DiscoverCatalog: React.FC<DiscoverCatalogProps> = ({
  shelves,
  onCloneSuccess,
  onCreateNewShelf,
}) => {
  const [catalog, setCatalog] = useState<(Subject & { cardsPreview: Partial<Card>[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSubjectToClone, setSelectedSubjectToClone] = useState<
    (Subject & { cardsPreview: Partial<Card>[] }) | null
  >(null);
  const [clonedSuccessId, setClonedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    ApiService.getDiscoverCatalog().then((res) => {
      if (res.isSuccess && res.data) {
        setCatalog(res.data);
      }
      setIsLoading(false);
    });
  }, []);

  const allTags = Array.from(
    new Set(catalog.flatMap((item) => item.tags))
  );

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const handleCloneModalSuccess = (clonedSubject: Subject, targetShelfId: string) => {
    setClonedSuccessId(clonedSubject.id);
    onCloneSuccess();
    setTimeout(() => setClonedSuccessId(null), 3500);
  };

  return (
    <div id="discover-catalog-page" className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#8BC34A] text-xs font-extrabold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Community Decks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Discover High-Yield Flashcard Sets
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Browse verified study decks in Computer Science, Medicine, Languages, and DevOps.
            Preview cards and choose a destination shelf to clone any deck into your library.
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Categories */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search verified decks by topic or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8BC34A]"
          />
        </div>

        <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
          Showing <span className="font-bold text-stone-800 dark:text-stone-200">{filteredCatalog.length}</span> curated decks
        </div>
      </div>

      {/* Tag Pills */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedTag === null
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            All Categories
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#8BC34A] text-white'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-stone-400">Loading catalog...</div>
      ) : filteredCatalog.length === 0 ? (
        <div className="py-16 text-center text-xs text-stone-400">No decks found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCatalog.map((item) => {
            const isSuccess = clonedSuccessId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-2xs shrink-0"
                      style={{ backgroundColor: item.color || '#8BC34A' }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {item.cardCount} cards
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Cards Preview Chips */}
                  {item.cardsPreview && item.cardsPreview.length > 0 && (
                    <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 sm:p-3 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1">
                      <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                        Sample Concepts:
                      </span>
                      {item.cardsPreview.slice(0, 2).map((cp, idx) => (
                        <div key={idx} className="text-xs text-stone-700 dark:text-stone-300 font-medium truncate">
                          • {cp.front}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Review & Clone Action Button */}
                <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => setSelectedSubjectToClone(item)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#8BC34A] hover:bg-[#7CB342] text-white shadow-xs'
                    }`}
                  >
                    {isSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Cloned to Shelf!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Review & Clone to Shelf</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popup to Review and Choose Shelf to Move / Clone Subject to */}
      <CloneSubjectModal
        isOpen={Boolean(selectedSubjectToClone)}
        onClose={() => setSelectedSubjectToClone(null)}
        subject={selectedSubjectToClone}
        shelves={shelves}
        onCloneSuccess={handleCloneModalSuccess}
        onCreateNewShelf={onCreateNewShelf}
      />
    </div>
  );
};

