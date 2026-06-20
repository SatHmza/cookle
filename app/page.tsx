"use client";

import { useState, useEffect } from "react";
import { matchRecipe, resolveRecipe, RECIPES } from "@/lib/recipes";
import { CUISINE_RECIPES } from "@/lib/cuisine-recipes";
import type { ResolvedRecipe, Recipe } from "@/lib/recipes";
import { INGREDIENT_SWAPS } from "@/lib/swaps";
import { NUTRITION } from "@/lib/nutrition";
import {
  getSavedRecipes, saveRecipe, unsaveRecipe, isRecipeSaved,
  getRatings, setRating,
  getPantryStaples, setPantryStaples,
  getStreak, markCookedToday,
  getNextSurpriseIndex,
  getRecentRecipes, addRecentRecipe,
  getDarkMode, saveDarkMode,
} from "@/lib/storage";

const ALL_RECIPES: Recipe[] = [...RECIPES, ...CUISINE_RECIPES];
const CUISINES = ["All", "Italian", "Moroccan"];
const DIETARY_OPTIONS = ["None", "Vegetarian", "Vegan", "Gluten-free", "Keto", "Dairy-free", "Halal"];
const TIME_OPTIONS = ["15 mins", "30 mins", "45 mins", "1 hour", "No limit"];
const LEVEL_OPTIONS = ["All", "Beginner", "Intermediate", "Pro"];

const COOKING_TIPS = [
  "Salt your pasta water until it tastes like the sea.",
  "Pat meat completely dry before searing — moisture kills a good crust.",
  "Rest meat a few minutes before slicing or the juices run out.",
  "A squeeze of lemon at the end brightens almost any dish.",
  "Toast whole spices in a dry pan before using them.",
  "Taste and season as you cook, not just at the end.",
  "Don't crowd the pan — everything steams instead of searing.",
  "Room temperature proteins cook more evenly than cold ones.",
  "Cold butter whisked into a sauce at the end makes it silky.",
  "Save pasta water — the starch helps sauce cling to every strand.",
  "High heat for searing. Low heat for eggs. Never swap these.",
  "When something tastes flat, try acid first before more salt.",
  "Have everything prepped before you turn on the heat.",
  "A hot pan before adding oil prevents sticking.",
  "Garlic burns in seconds. Add it after onions are already soft.",
  "Dried herbs go in early. Fresh herbs go in at the very end.",
  "Season in layers throughout cooking, not just at the end.",
  "Underseasoning is the most common home-cooking mistake.",
  "Deglaze the pan after browning meat — that's where the flavor is.",
  "Add a pinch of sugar to tomato sauces to balance the acidity.",
  "Always taste the dressing before putting it on the salad.",
  "Chop aromatics smaller than everything else so they melt in.",
  "Don't lift the lid when steaming. Every peek adds time.",
  "Let butter foam and settle before adding food.",
];

function getDayIndex() { return Math.floor(Date.now() / 86400000); }

function findSwap(ingredient: string): string | null {
  const key = ingredient.toLowerCase();
  for (const [k, v] of Object.entries(INGREDIENT_SWAPS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// ── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700"
      style={{ backgroundColor: "var(--page-bg)", opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="mb-2">
        <span className="text-6xl select-none animate-cutlery inline-block">🍴</span>
      </div>
      <p className="mt-6 text-2xl font-bold text-orange-500 tracking-tight">Cookle</p>
      <p className="text-stone-400 text-sm mt-1">getting the kitchen ready…</p>
    </div>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition-all ${
        active
          ? "bg-orange-500 text-white border-orange-500"
          : "text-stone-500 dark:text-[#9A8578] border-stone-200 dark:border-[#3D2A1E] hover:border-orange-400 hover:text-orange-500 bg-white dark:bg-[#2A1A0E]"
      }`}
    >
      {label}
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [appReady, setAppReady]           = useState(false);
  const [darkMode, setDarkMode]           = useState(false);
  const [ingredients, setIngredients]     = useState("");
  const [pantryOnly, setPantryOnly]       = useState(false);
  const [dietary, setDietary]             = useState("None");
  const [timeLimit, setTimeLimit]         = useState("30 mins");
  const [cuisine, setCuisine]             = useState("All");
  const [level, setLevel]                 = useState("All");
  const [challenge, setChallenge]         = useState(false);
  const [servings, setServings]           = useState(2);
  const [recipe, setRecipe]               = useState<ResolvedRecipe | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPantry, setShowPantry]       = useState(false);
  const [pantryInput, setPantryInput]     = useState("");
  const [pantryStaples, setPantryState]   = useState<string[]>([]);
  const [savedRecipes, setSavedState]     = useState<ResolvedRecipe[]>([]);
  const [ratings, setRatingsState]        = useState<Record<string, "up" | "down">>({});
  const [streak, setStreak]               = useState(0);
  const [showDailySteps, setShowDailySteps] = useState(false);
  const [dayIndex, setDayIndex]           = useState(0);
  const [copied, setCopied]               = useState(false);
  const [recentRecipes, setRecentState]   = useState<ResolvedRecipe[]>([]);

  useEffect(() => {
    const dm = getDarkMode();
    setDarkMode(dm);
    document.documentElement.classList.toggle("dark", dm);
    setDayIndex(getDayIndex());
    setPantryState(getPantryStaples());
    setSavedState(getSavedRecipes());
    setRatingsState(getRatings());
    setStreak(getStreak());
    setRecentState(getRecentRecipes());
    const t = setTimeout(() => setAppReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    saveDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  }

  const dailyRecipe = ALL_RECIPES[dayIndex % ALL_RECIPES.length];
  const dailyTips   = [0, 1, 2, 3].map(i => COOKING_TIPS[(dayIndex + i) % COOKING_TIPS.length]);

  function getPool() {
    return cuisine === "All" ? ALL_RECIPES : ALL_RECIPES.filter(r => r.cuisine === cuisine);
  }

  function handleIngredientChange(val: string) {
    if (challenge) {
      const parts = val.split(",").filter(s => s.trim());
      if (parts.length > 3) { setError("Challenge mode: max 3 ingredients!"); return; }
    }
    setIngredients(val);
  }

  function pushRecipe(result: ResolvedRecipe) {
    setRecipe(result);
    setServings(result.servings ?? 2);
    addRecentRecipe(result);
    setRecentState(getRecentRecipes());
    setStreak(markCookedToday());
    setSavedState(getSavedRecipes());
    setRatingsState(getRatings());
  }

  async function generate(ing?: string) {
    const effectiveIng = pantryOnly ? pantryStaples.join(", ") : (ing ?? ingredients);
    if (!effectiveIng.trim()) {
      setError(pantryOnly ? "Your pantry is empty — add staples first." : "Add some ingredients first.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    try {
      pushRecipe(matchRecipe(effectiveIng, dietary, timeLimit, level, getPool()));
    } catch { setError("Something went wrong. Try again."); }
    finally  { setLoading(false); }
  }

  function surpriseMe() {
    const p = getPool();
    const idx = getNextSurpriseIndex(p.length, `cookle_rotation_${cuisine}`);
    const userIng = (pantryOnly ? pantryStaples.join(", ") : ingredients)
      .toLowerCase().split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    pushRecipe(resolveRecipe(p[idx], userIng));
  }

  function toggleSave() {
    if (!recipe) return;
    isRecipeSaved(recipe.name) ? unsaveRecipe(recipe.name) : saveRecipe(recipe);
    setSavedState(getSavedRecipes());
  }

  function rate(r: "up" | "down") {
    if (!recipe) return;
    setRating(recipe.name, ratings[recipe.name] === r ? null : r);
    setRatingsState(getRatings());
  }

  function savePantry() {
    const s = pantryInput.split(",").map(s => s.trim()).filter(Boolean);
    setPantryStaples(s);
    setPantryState(s);
    setShowPantry(false);
  }

  function loadPantry() {
    if (!pantryStaples.length) return;
    const str = pantryStaples.join(", ");
    setIngredients(prev => prev.trim() ? `${prev.trim()}, ${str}` : str);
  }

  async function share() {
    if (!recipe) return;
    const text = `${recipe.emoji} ${recipe.name}\n${recipe.description}\n\nFound on Cookle`;
    if (navigator.share) { await navigator.share({ title: recipe.name, text }); }
    else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isSaved         = recipe ? isRecipeSaved(recipe.name) : false;
  const currentRating   = recipe ? ratings[recipe.name] : undefined;
  const defaultServings = recipe?.servings ?? 2;
  const scale           = servings / defaultServings;
  const nutrition       = recipe ? NUTRITION[recipe.name] : null;

  const T = {
    primary:   "text-stone-800 dark:text-[#F5EEE6]",
    secondary: "text-stone-500 dark:text-[#9A8578]",
    muted:     "text-stone-400 dark:text-[#7A6558]",
  };

  return (
    <>
      <LoadingScreen visible={!appReady} />

      <main className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
        <div className="max-w-5xl mx-auto px-5 py-10 grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-10">

          {/* ── LEFT ─────────────────────────────────────────────────────── */}
          <div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-orange-500">Cookle</h1>
                <p className={`text-xs mt-0.5 tracking-wide ${T.muted}`}>Open the fridge. Get a decision.</p>
              </div>
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 dark:bg-[#2A1A0E] border border-orange-100 dark:border-[#3D2A1E] px-3 py-1 rounded-full">
                    🔥 {streak} day{streak > 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={toggleDark}
                  className={`text-lg px-2.5 py-1 rounded-full border transition-all ${T.secondary} border-stone-200 dark:border-[#3D2A1E] hover:border-orange-300`}
                  title="Toggle dark mode"
                  style={{ backgroundColor: "var(--card-bg)" }}
                >
                  {darkMode ? "☀️" : "🌙"}
                </button>
                <button
                  onClick={() => setShowFavorites(v => !v)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    showFavorites
                      ? "bg-orange-500 text-white border-orange-500"
                      : `${T.secondary} border-stone-200 dark:border-[#3D2A1E] hover:border-orange-300`
                  }`}
                  style={showFavorites ? {} : { backgroundColor: "var(--card-bg)" }}
                >
                  ❤️ {savedRecipes.length > 0 ? savedRecipes.length : "Saved"}
                </button>
              </div>
            </div>

            {/* Input card */}
            <div className="rounded-2xl shadow-sm border border-orange-100 dark:border-[#3D2A1E] p-5 mb-4" style={{ backgroundColor: "var(--card-bg)" }}>

              {/* Cuisine */}
              <div className="mb-4">
                <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${T.muted}`}>Cuisine</p>
                <div className="flex flex-wrap gap-1.5">
                  {CUISINES.map(c => <Chip key={c} label={c} active={cuisine === c} onClick={() => setCuisine(c)} />)}
                </div>
              </div>

              {/* Ingredient input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${T.muted}`}>
                    {pantryOnly ? "Searching your pantry" : `What's in your fridge?${challenge ? " (max 3)" : ""}`}
                  </p>
                  <div className="flex items-center gap-3">
                    {!pantryOnly && pantryStaples.length > 0 && (
                      <button onClick={loadPantry} className="text-[11px] text-orange-500 hover:text-orange-700 font-medium transition-colors">
                        + Load pantry
                      </button>
                    )}
                    <button
                      onClick={() => setPantryOnly(v => !v)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        pantryOnly
                          ? "bg-orange-500 text-white border-orange-500"
                          : `${T.secondary} border-stone-200 dark:border-[#3D2A1E] hover:border-orange-400`
                      }`}
                      style={pantryOnly ? {} : { backgroundColor: "var(--card-bg)" }}
                    >
                      🥫 Pantry only
                    </button>
                  </div>
                </div>

                {pantryOnly ? (
                  <div
                    className="rounded-xl border border-dashed border-orange-200 dark:border-[#3D2A1E] px-4 py-3 min-h-[72px] flex flex-wrap gap-1.5 items-start content-start"
                    style={{ backgroundColor: "var(--orange-tint)" }}
                  >
                    {pantryStaples.length === 0 ? (
                      <p className={`text-xs ${T.muted}`}>No pantry staples yet — add them in the sidebar.</p>
                    ) : (
                      pantryStaples.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-orange-500 text-white font-medium">{s}</span>
                      ))
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    value={ingredients}
                    onChange={e => handleIngredientChange(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                    placeholder="chicken, garlic, tomatoes, pasta…"
                    className={`w-full rounded-xl border px-4 py-3 text-sm placeholder-stone-300 dark:placeholder-[#5A4438] focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none transition-colors border-stone-200 dark:border-[#3D2A1E] ${T.primary}`}
                    style={{ backgroundColor: "var(--subtle-bg)" }}
                  />
                )}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Dietary", opts: DIETARY_OPTIONS, val: dietary, set: setDietary },
                  { label: "Time", opts: TIME_OPTIONS, val: timeLimit, set: setTimeLimit },
                  { label: "Chef level", opts: LEVEL_OPTIONS, val: level, set: setLevel },
                ].map(({ label, opts, val, set }) => (
                  <div key={label}>
                    <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${T.muted}`}>{label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {opts.map(o => <Chip key={o} label={o} active={val === o} onClick={() => set(o)} />)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Challenge */}
              <button
                onClick={() => setChallenge(v => !v)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  challenge
                    ? "bg-orange-500 text-white border-orange-500"
                    : `${T.secondary} border-stone-200 dark:border-[#3D2A1E] hover:border-orange-400`
                }`}
                style={challenge ? {} : { backgroundColor: "var(--card-bg)" }}
              >
                🎯 Challenge mode{challenge ? " — max 3 ingredients" : ""}
              </button>
            </div>

            {error && <p className="text-xs text-red-400 mb-3 px-1">{error}</p>}

            {/* CTA buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => generate()} disabled={loading}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-sm font-bold tracking-wide hover:bg-orange-600 disabled:opacity-40 transition-all shadow-sm"
              >
                {loading ? "Deciding…" : "Decide for me →"}
              </button>
              <button
                onClick={surpriseMe} disabled={loading}
                className="px-5 py-3 border-2 border-orange-200 dark:border-[#3D2A1E] text-orange-500 rounded-xl text-sm font-bold hover:border-orange-500 disabled:opacity-40 transition-all"
                style={{ backgroundColor: "var(--card-bg)" }}
              >
                🎲 Surprise me
              </button>
            </div>

            {/* Recently viewed */}
            {recentRecipes.length > 0 && (
              <div className="mb-6">
                <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 px-1 ${T.muted}`}>Recently viewed</p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recentRecipes.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setRecipe(r); setServings(r.servings ?? 2); }}
                      className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-orange-100 dark:border-[#3D2A1E] shadow-sm hover:border-orange-400 transition-all text-left"
                      style={{ backgroundColor: "var(--card-bg)" }}
                    >
                      <span className="text-xl leading-none">{r.emoji}</span>
                      <div>
                        <p className={`text-xs font-semibold leading-tight max-w-[120px] truncate ${T.primary}`}>{r.name}</p>
                        <p className={`text-[10px] ${T.muted}`}>{r.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Favorites panel */}
            {showFavorites && (
              <div className="rounded-2xl shadow-sm border border-orange-100 dark:border-[#3D2A1E] overflow-hidden mb-6 animate-fade-up" style={{ backgroundColor: "var(--card-bg)" }}>
                <div className="px-5 py-3 border-b border-stone-100 dark:border-[#3D2A1E]">
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${T.muted}`}>Saved recipes</p>
                </div>
                {savedRecipes.length === 0 ? (
                  <p className={`px-5 py-4 text-sm ${T.muted}`}>No saved recipes yet — hit ❤️ on any recipe to save it.</p>
                ) : (
                  <ul>
                    {savedRecipes.map((r, i) => (
                      <li
                        key={i}
                        onClick={() => { setRecipe(r); setServings(r.servings ?? 2); setShowFavorites(false); }}
                        className="px-5 py-3 flex items-center justify-between gap-3 border-b border-stone-50 dark:border-[#3D2A1E] last:border-0 hover:bg-orange-50 dark:hover:bg-[#2A1A0E] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl">{r.emoji}</span>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${T.primary}`}>{r.name}</p>
                            <p className={`text-xs ${T.muted}`}>{r.time} · {r.difficulty}</p>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); unsaveRecipe(r.name); setSavedState(getSavedRecipes()); }}
                          className={`text-xs flex-shrink-0 transition-colors ${T.muted} hover:text-red-400`}
                        >✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Recipe card */}
            {recipe && !loading && (
              <div className="rounded-2xl shadow-sm border border-orange-100 dark:border-[#3D2A1E] overflow-hidden animate-fade-up" style={{ backgroundColor: "var(--card-bg)" }}>

                {/* Header */}
                <div className="px-6 py-6 border-b border-stone-100 dark:border-[#3D2A1E]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-4xl leading-none">{recipe.emoji}</span>
                        {recipe.cuisine && (
                          <span className="text-[11px] font-bold text-orange-500 bg-orange-50 dark:bg-[#2A1A0E] border border-orange-100 dark:border-[#3D2A1E] px-2.5 py-0.5 rounded-full">
                            {recipe.cuisine}
                          </span>
                        )}
                      </div>
                      <h2 className={`text-xl font-bold leading-snug ${T.primary}`}>{recipe.name}</h2>
                      <p className={`text-sm mt-1.5 leading-relaxed ${T.secondary}`}>{recipe.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <p className={`text-xs font-medium ${T.secondary}`}>{recipe.time}</p>
                      <p className={`text-xs ${T.muted}`}>{recipe.difficulty}</p>
                      {recipe.calories && <p className={`text-xs ${T.muted}`}>~{recipe.calories} kcal</p>}
                    </div>
                  </div>

                  {/* Nutrition badges */}
                  {nutrition && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {[
                        { label: "Protein", value: nutrition.protein, cls: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-[#0D1A2A] border-blue-100 dark:border-[#1A2E40]" },
                        { label: "Carbs",   value: nutrition.carbs,   cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-[#2A1A00] border-amber-100 dark:border-[#3D2800]" },
                        { label: "Fat",     value: nutrition.fat,     cls: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-[#0D1F0D] border-green-100 dark:border-[#1A3A1A]" },
                      ].map(({ label, value, cls }) => (
                        <span key={label} className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
                          {value}g {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Serving adjuster */}
                  <div className="flex items-center gap-3 mt-4">
                    <p className={`text-xs font-medium ${T.muted}`}>Serves</p>
                    <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: "var(--subtle-bg)" }}>
                      <button onClick={() => setServings(s => Math.max(1, s - 1))} className={`${T.muted} hover:text-orange-500 font-bold text-sm w-4 transition-colors`}>−</button>
                      <span className={`text-sm font-bold w-4 text-center ${T.primary}`}>{servings}</span>
                      <button onClick={() => setServings(s => Math.min(12, s + 1))} className={`${T.muted} hover:text-orange-500 font-bold text-sm w-4 transition-colors`}>+</button>
                    </div>
                    {scale !== 1 && (
                      <p className={`text-[11px] ${T.muted}`}>×{Number.isInteger(scale) ? scale : scale.toFixed(1)} quantities</p>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={toggleSave}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isSaved ? "bg-orange-500 text-white border-orange-500" : `${T.secondary} border-stone-200 dark:border-[#3D2A1E] hover:border-orange-300`
                      }`}
                      style={isSaved ? {} : { backgroundColor: "var(--card-bg)" }}
                    >{isSaved ? "❤️ Saved" : "🤍 Save"}</button>
                    <button
                      onClick={() => rate("up")}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        currentRating === "up"
                          ? "bg-green-100 dark:bg-[#0D1F0D] border-green-300 dark:border-[#1A3A1A] text-green-700 dark:text-green-400"
                          : `${T.muted} border-stone-200 dark:border-[#3D2A1E] hover:border-green-300`
                      }`}
                      style={currentRating === "up" ? {} : { backgroundColor: "var(--card-bg)" }}
                    >👍</button>
                    <button
                      onClick={() => rate("down")}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        currentRating === "down"
                          ? "bg-red-100 dark:bg-[#1F0D0D] border-red-300 dark:border-[#3D1A1A] text-red-600 dark:text-red-400"
                          : `${T.muted} border-stone-200 dark:border-[#3D2A1E] hover:border-red-200`
                      }`}
                      style={currentRating === "down" ? {} : { backgroundColor: "var(--card-bg)" }}
                    >👎</button>
                    <button
                      onClick={share}
                      className={`ml-auto px-3 py-1.5 rounded-full text-xs border transition-all ${T.muted} border-stone-200 dark:border-[#3D2A1E] hover:border-orange-300 hover:text-orange-500`}
                      style={{ backgroundColor: "var(--card-bg)" }}
                    >{copied ? "✓ Copied!" : "📤 Share"}</button>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="px-6 py-5 border-b border-stone-100 dark:border-[#3D2A1E] space-y-4">
                  {recipe.matched_ingredients.length > 0 && (
                    <div>
                      <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${T.muted}`}>You already have</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.matched_ingredients.map((ing, i) => (
                          <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-orange-500 text-white font-medium">
                            <span className="text-orange-200 text-[10px]">✓</span> {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {recipe.extra_ingredients.length > 0 && (
                    <div>
                      <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${T.muted}`}>You'll need</p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.extra_ingredients.map((ing, i) => {
                          const swap = findSwap(ing);
                          return (
                            <div key={i} className="group relative">
                              <span
                                className={`px-3 py-1 rounded-full text-xs border ${T.secondary} border-stone-200 dark:border-[#3D2A1E] cursor-default inline-block`}
                                style={{ backgroundColor: "var(--subtle-bg)" }}
                              >
                                {ing}{swap && <span className="ml-1 text-orange-400 text-[10px]">↔</span>}
                              </span>
                              {swap && (
                                <div className="absolute bottom-full left-0 mb-1.5 z-10 hidden group-hover:block min-w-max">
                                  <div
                                    className={`text-xs px-3 py-1.5 rounded-lg shadow-md border border-stone-200 dark:border-[#3D2A1E] ${T.secondary}`}
                                    style={{ backgroundColor: "var(--card-bg)" }}
                                  >
                                    <span className={T.muted}>can't find it?</span> → {swap}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {recipe.extra_ingredients.some(ing => findSwap(ing)) && (
                        <p className={`text-[10px] mt-2 ${T.muted}`}>↔ Hover an ingredient for a substitution</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div className="px-6 py-5">
                  <p className={`text-[10px] font-bold tracking-widest uppercase mb-4 ${T.muted}`}>How to make it</p>
                  <ol className="space-y-4">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-4 text-sm leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-[#2A1A0E] text-orange-500 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className={T.secondary}>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {recipe.gremlin_note && (
                    <div className="mt-6 pt-5 border-t border-stone-100 dark:border-[#3D2A1E]">
                      <p className={`text-xs italic leading-relaxed ${T.muted}`}>🧌 {recipe.gremlin_note}</p>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => generate()}
                    className="w-full border border-orange-100 dark:border-[#3D2A1E] text-orange-400 text-xs font-semibold py-2.5 rounded-xl hover:text-orange-600 transition-all"
                    style={{ backgroundColor: "var(--orange-tint)" }}
                  >
                    Try a different one
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <aside className="space-y-4 lg:pt-[108px]">

            {/* Pantry */}
            <div className="rounded-2xl shadow-sm border border-orange-100 dark:border-[#3D2A1E] overflow-hidden" style={{ backgroundColor: "var(--card-bg)" }}>
              <div className="px-4 py-3 border-b border-stone-100 dark:border-[#3D2A1E] flex items-center justify-between">
                <p className={`text-[10px] font-bold tracking-widest uppercase ${T.muted}`}>My pantry</p>
                <button
                  onClick={() => { setShowPantry(v => !v); setPantryInput(pantryStaples.join(", ")); }}
                  className="text-[11px] text-orange-400 hover:text-orange-600 font-medium transition-colors"
                >
                  {showPantry ? "Cancel" : "Edit"}
                </button>
              </div>
              {showPantry ? (
                <div className="px-4 py-4 space-y-3">
                  <p className={`text-xs ${T.muted}`}>Your staples, comma separated</p>
                  <textarea
                    rows={3}
                    value={pantryInput}
                    onChange={e => setPantryInput(e.target.value)}
                    placeholder="olive oil, garlic, salt, onion…"
                    className={`w-full border border-stone-200 dark:border-[#3D2A1E] rounded-xl px-3 py-2 text-xs placeholder-stone-300 dark:placeholder-[#5A4438] focus:outline-none focus:border-orange-400 resize-none ${T.primary}`}
                    style={{ backgroundColor: "var(--subtle-bg)" }}
                  />
                  <button onClick={savePantry} className="w-full bg-orange-500 text-white text-xs font-semibold py-2 rounded-xl hover:bg-orange-600 transition-all">
                    Save pantry
                  </button>
                </div>
              ) : (
                <div className="px-4 py-4">
                  {pantryStaples.length === 0 ? (
                    <p className={`text-xs leading-relaxed ${T.muted}`}>Save your staples so you don't retype them every session.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {pantryStaples.map((s, i) => (
                        <span key={i} className={`px-2.5 py-1 rounded-full text-xs border border-stone-200 dark:border-[#3D2A1E] ${T.secondary}`} style={{ backgroundColor: "var(--subtle-bg)" }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recipe of the day */}
            <div className="rounded-2xl shadow-sm border border-orange-100 dark:border-[#3D2A1E] overflow-hidden" style={{ backgroundColor: "var(--card-bg)" }}>
              <div className="px-4 py-3 border-b border-stone-100 dark:border-[#3D2A1E] flex items-center justify-between">
                <p className={`text-[10px] font-bold tracking-widest uppercase ${T.muted}`}>Recipe of the day</p>
                <span className="text-[11px] text-orange-400 font-semibold">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none flex-shrink-0">{dailyRecipe.emoji}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold leading-snug ${T.primary}`}>{dailyRecipe.name}</p>
                    <p className={`text-xs mt-0.5 ${T.muted}`}>{dailyRecipe.time} min · {dailyRecipe.difficulty}</p>
                  </div>
                </div>
                <p className={`text-xs mt-3 leading-relaxed ${T.secondary}`}>{dailyRecipe.description}</p>
                <button onClick={() => setShowDailySteps(v => !v)} className="mt-3 text-xs text-orange-400 hover:text-orange-600 font-medium transition-colors">
                  {showDailySteps ? "Hide steps ↑" : "Show steps ↓"}
                </button>
                {showDailySteps && (
                  <ol className="mt-3 space-y-2.5">
                    {dailyRecipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed">
                        <span className="font-bold text-orange-300 flex-shrink-0 mt-px">{i + 1}</span>
                        <span className={T.secondary}>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl shadow-sm border border-orange-100 dark:border-[#3D2A1E] overflow-hidden" style={{ backgroundColor: "var(--card-bg)" }}>
              <div className="px-4 py-3 border-b border-stone-100 dark:border-[#3D2A1E]">
                <p className={`text-[10px] font-bold tracking-widest uppercase ${T.muted}`}>Tips for today</p>
              </div>
              <ul className="px-4 py-4 space-y-3">
                {dailyTips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
                    <span className="text-orange-300 font-bold flex-shrink-0">—</span>
                    <span className={T.secondary}>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

          </aside>
        </div>
      </main>
    </>
  );
}
