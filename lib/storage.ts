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
