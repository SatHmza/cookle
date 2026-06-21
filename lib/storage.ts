import type { ResolvedRecipe } from "./recipes";

// ── Favorites ──────────────────────────────────────────────────────────────

export function getSavedRecipes(): ResolvedRecipe[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("cookle_saved") || "[]"); }
  catch { return []; }
}

export function saveRecipe(recipe: ResolvedRecipe): void {
  const saved = getSavedRecipes();
  if (!saved.find((r) => r.name === recipe.name)) {
    saved.unshift(recipe);
    localStorage.setItem("cookle_saved", JSON.stringify(saved));
  }
}

export function unsaveRecipe(name: string): void {
  const saved = getSavedRecipes().filter((r) => r.name !== name);
  localStorage.setItem("cookle_saved", JSON.stringify(saved));
}

export function isRecipeSaved(name: string): boolean {
  return getSavedRecipes().some((r) => r.name === name);
}

// ── Ratings ────────────────────────────────────────────────────────────────

export function getRatings(): Record<string, "up" | "down"> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("cookle_ratings") || "{}"); }
  catch { return {}; }
}

export function setRating(name: string, rating: "up" | "down" | null): void {
  try {
    const ratings = getRatings();
    if (rating === null) delete ratings[name];
    else ratings[name] = rating;
    localStorage.setItem("cookle_ratings", JSON.stringify(ratings));
  } catch {}
}

// ── Pantry staples ─────────────────────────────────────────────────────────

export function getPantryStaples(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("cookle_pantry") || "[]"); }
  catch { return []; }
}

export function setPantryStaples(staples: string[]): void {
  localStorage.setItem("cookle_pantry", JSON.stringify(staples));
}

// ── Streak ─────────────────────────────────────────────────────────────────

export function getStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const d = JSON.parse(localStorage.getItem("cookle_streak") || '{"count":0,"last":""}');
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (d.last === today || d.last === yesterday) return d.count;
    return 0;
  } catch { return 0; }
}

export function markCookedToday(): number {
  try {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const d = JSON.parse(localStorage.getItem("cookle_streak") || '{"count":0,"last":""}');
    if (d.last === today) return d.count;
    const count = d.last === yesterday ? d.count + 1 : 1;
    localStorage.setItem("cookle_streak", JSON.stringify({ count, last: today }));
    return count;
  } catch { return 1; }
}

// ── Recent recipes ─────────────────────────────────────────────────────────

const RECENT_KEY = "cookle_recent_v1";

export function getRecentRecipes(): ResolvedRecipe[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

export function addRecentRecipe(recipe: ResolvedRecipe): void {
  try {
    const recent = getRecentRecipes().filter(r => r.name !== recipe.name);
    localStorage.setItem(RECENT_KEY, JSON.stringify([recipe, ...recent].slice(0, 3)));
  } catch {}
}

// ── Dark mode preference ───────────────────────────────────────────────────

export function getDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("cookle_dark") === "1";
}

export function saveDarkMode(dark: boolean): void {
  try { localStorage.setItem("cookle_dark", dark ? "1" : "0"); } catch {}
}

// ── Cook history ───────────────────────────────────────────────────────────

export function getCookHistory(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("cookle_history") || "{}"); }
  catch { return {}; }
}

export function recordCooked(name: string): number {
  try {
    const h = getCookHistory();
    h[name] = (h[name] ?? 0) + 1;
    localStorage.setItem("cookle_history", JSON.stringify(h));
    return h[name];
  } catch { return 1; }
}

// ── Recipe notes ───────────────────────────────────────────────────────────

export function getNote(name: string): string {
  if (typeof window === "undefined") return "";
  try { return JSON.parse(localStorage.getItem("cookle_notes") || "{}")[name] ?? ""; }
  catch { return ""; }
}

export function setNote(name: string, note: string): void {
  try {
    const notes = JSON.parse(localStorage.getItem("cookle_notes") || "{}");
    if (note.trim()) notes[name] = note;
    else delete notes[name];
    localStorage.setItem("cookle_notes", JSON.stringify(notes));
  } catch {}
}

// ── Shopping list ──────────────────────────────────────────────────────────

export function getShoppingList(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("cookle_shopping") || "[]"); }
  catch { return []; }
}

export function addToShoppingList(items: string[]): void {
  try {
    const list = getShoppingList();
    const merged = [...list, ...items.filter(i => !list.includes(i))];
    localStorage.setItem("cookle_shopping", JSON.stringify(merged));
  } catch {}
}

export function removeFromShoppingList(item: string): void {
  try {
    const list = getShoppingList().filter(i => i !== item);
    localStorage.setItem("cookle_shopping", JSON.stringify(list));
    const checked = getCheckedShoppingItems().filter(i => i !== item);
    localStorage.setItem("cookle_shopping_checked", JSON.stringify(checked));
  } catch {}
}

export function clearShoppingList(): void {
  try {
    localStorage.removeItem("cookle_shopping");
    localStorage.removeItem("cookle_shopping_checked");
  } catch {}
}

export function getCheckedShoppingItems(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("cookle_shopping_checked") || "[]"); }
  catch { return []; }
}

export function toggleCheckedItem(item: string): void {
  try {
    const checked = getCheckedShoppingItems();
    const next = checked.includes(item) ? checked.filter(i => i !== item) : [...checked, item];
    localStorage.setItem("cookle_shopping_checked", JSON.stringify(next));
  } catch {}
}

// ── Surprise Me rotation ───────────────────────────────────────────────────

function shuffle(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getNextSurpriseIndex(poolSize: number, key = "cookle_rotation"): number {
  try {
    const posKey = key + "_pos";
    const stored = localStorage.getItem(key);
    const pos = parseInt(localStorage.getItem(posKey) || "0", 10);

    if (!stored || pos >= poolSize) {
      const q = shuffle(poolSize);
      localStorage.setItem(key, JSON.stringify(q));
      localStorage.setItem(posKey, "1");
      return q[0];
    }

    const q: number[] = JSON.parse(stored);
    const idx = q[pos] ?? q[0];
    localStorage.setItem(posKey, String(pos + 1));
    return idx;
  } catch {
    return Math.floor(Math.random() * poolSize);
  }
}
