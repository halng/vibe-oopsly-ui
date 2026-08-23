import { Shelf } from './src/types';
const shelves: Shelf[] = [];
const selectedShelfId: string | null = null;
const activeShelf = (() => {
  if (!selectedShelfId) return null;
  return shelves.find((s) => s.id === selectedShelfId && !s.isDeleted) || null;
})();
console.log(activeShelf?.id);
