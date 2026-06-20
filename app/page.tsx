"use client";

import { useState, useEffect } from "react";
import { matchRecipe, resolveRecipe, RECIPES } from "@/lib/recipes";
import { CUISINE_RECIPES } from "@/lib/cuisine-recipes";
import type { ResolvedRecipe, Recipe } from "@/lib/recipes";
import {
  getSavedRecipes, saveRecipe, unsaveRecipe, isRecipeSaved,
  getRatings, setRating,
  getPantryStaples, setPantryStaples,
  getStreak, markCookedToday,
  getNextSurpriseIndex,
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

// ── Loading screen ──────────────────────────────────────────────────────────

function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700"
      style={{
        backgroundColor: "#FDF8F3",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Steam */}
        <div className="flex gap-2 mb-1 h-6 items-end">
          <span className="text-stone-300 text-lg animate-steam1 inline-block">〜</span>
          <span className="text-stone-300 text-lg animate-steam2 inline-block">〜</span>
          <span className="text-stone-300 text-lg animate-steam3 inline-block">〜</span>
        </div>
        {/* Potato */}
        <span className="text-6xl animate-bob select-none">🥔</span>
      </div>
      <p className="mt-6 text-2xl font-bold text-orange-500 tracking-tight">Cookle</p>
      <p className="text-stone-400 text-sm mt-1">getting the kitchen ready…</p>
    </div>
  );
}

// ── Chip component ──────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition-all ${
        active
          ? "bg-orange-500 text-white border-orange-500"
          : "text-stone-500 border-stone-200 hover:border-orange-400 hover:text-orange-500 bg-white"
      }`}
    >
      {label}
    </button>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [appReady, setAppReady] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [dietary, setDietary] = useState("None");
  const [timeLimit, setTimeLimit] = useState("30 mins");
  const [cuisine, setCuisine] = useState("All");
  const [level, setLevel] = useState("All");
  const [challenge, setChallenge] = useState(false);
  const [servings, setServings] = useState(2);
  const [recipe, setRecipe] = useState<ResolvedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPantry, setShowPantry] = useState(false);
  const [pantryInput, setPantryInput] = useState("");
  const [pantryStaples, setPantryStapleState] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipesState] = useState<ResolvedRecipe[]>([]);
  const [ratings, setRatingsState] = useState<Record<string, "up" | "down">>({});
  const [streak, setStreak] = useState(0);
  const [showDailySteps, setShowDailySteps] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDayIndex(getDayIndex());
    setPantryStapleState(getPantryStaples());
    setSavedRecipesState(getSavedRecipes());
    setRatingsState(getRatings());
    setStreak(getStreak());
    const t = setTimeout(() => setAppReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const dailyRecipe = ALL_RECIPES[dayIndex % ALL_RECIPES.length];
  const dailyTips = [0, 1, 2, 3].map(i => COOKING_TIPS[(dayIndex + i) % COOKING_TIPS.length]);

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

  async function generate(ing?: string) {
    const input = ing ?? ingredients;
    if (!input.trim()) { setError("Add some ingredients first."); return; }
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    try {
      const result = matchRecipe(input, dietary, timeLimit, level, getPool());
      setRecipe(result);
      setServings(result.servings ?? 2);
      setStreak(markCookedToday());
      setSavedRecipesState(getSavedRecipes());
      setRatingsState(getRatings());
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  }

  function surpriseMe() {
    const p = getPool();
    const idx = getNextSurpriseIndex(p.length, `cookle_rotation_${cuisine}`);
    const userIng = ingredients.toLowerCase().split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    const result = resolveRecipe(p[idx], userIng);
    setRecipe(result);
    setServings(result.servings ?? 2);
    setStreak(markCookedToday());
    setSavedRecipesState(getSavedRecipes());
  }

  function toggleSave() {
    if (!recipe) return;
    isRecipeSaved(recipe.name) ? unsaveRecipe(recipe.name) : saveRecipe(recipe);
    setSavedRecipesState(getSavedRecipes());
  }

  function rate(r: "up" | "down") {
    if (!recipe) return;
    setRating(recipe.name, ratings[recipe.name] === r ? null : r);
    setRatingsState(getRatings());
  }

  function savePantry() {
    const s = pantryInput.split(",").map(s => s.trim()).filter(Boolean);
    setPantryStaples(s);
    setPantryStapleState(s);
    setShowPantry(false);
  }

  function loadPantry() {
    if (!pantryStaples.length) return;
    const pantryStr = pantryStaples.join(", ");
    setIngredients(ingredients.trim() ? `${ingredients.trim()}, ${pantryStr}` : pantryStr);
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

  const isSaved = recipe ? isRecipeSaved(recipe.name) : false;
  const currentRating = recipe ? ratings[recipe.name] : undefined;
  const defaultServings = recipe?.servings ?? 2;
  const scale = servings / defaultServings;

  return (
    <>
      <LoadingScreen visible={!appReady} />

      <main className="min-h-screen" style={{ backgroundColor: "#FDF8F3" }}>
        <div className="max-w-5xl mx-auto px-5 py-10 grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-10">

          {/* ── LEFT ── */}
          <div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-orange-500">Cookle</h1>
                <p className="text-xs text-stone-400 mt-0.5 tracking-wide">Open the fridge. Get a decision.</p>
              </div>
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                    🔥 {streak} day{streak > 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={() => setShowFavorites(v => !v)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${showFavorites ? "bg-orange-500 text-white border-orange-500" : "bg-white text-stone-500 border-stone-200 hover:border-orange-300"}`}
                >
                  ❤️ {savedRecipes.length > 0 ? savedRecipes.length : "Saved"}
                </button>
              </div>
            </div>

            {/* Input card */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-4">

              {/* Cuisine */}
              <div className="mb-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Cuisine</p>
                <div className="flex flex-wrap gap-1.5">
                  {CUISINES.map(c => <Chip key={c} label={c} active={cuisine === c} onClick={() => setCuisine(c)} />)}
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                    What's in your fridge?{challenge ? " (max 3)" : ""}
                  </p>
                  {pantryStaples.length > 0 && (
                    <button onClick={loadPantry} className="text-[11px] text-orange-500 hover:text-orange-700 font-medium transition-colors">
                      + Load pantry
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={ingredients}
                  onChange={e => handleIngredientChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                  placeholder="chicken, garlic, tomatoes, pasta…"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Dietary", opts: DIETARY_OPTIONS, val: dietary, set: setDietary },
                  { label: "Time", opts: TIME_OPTIONS, val: timeLimit, set: setTimeLimit },
                  { label: "Chef level", opts: LEVEL_OPTIONS, val: level, set: setLevel },
                ].map(({ label, opts, val, set }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">{label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {opts.map(o => <Chip key={o} label={o} active={val === o} onClick={() => set(o)} />)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Challenge */}
              <button
                onClick={() => setChallenge(v => !v)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${challenge ? "bg-orange-500 text-white border-orange-500" : "bg-white text-stone-500 border-stone-200 hover:border-orange-400"}`}
              >
                🎯 Challenge mode{challenge ? " — max 3 ingredients" : ""}
              </button>
            </div>

            {error && <p className="text-xs text-red-400 mb-3 px-1">{error}</p>}

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => generate()} disabled={loading}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-sm font-bold tracking-wide hover:bg-orange-600 disabled:opacity-40 transition-all shadow-sm"
              >
                {loading ? "Deciding…" : "Decide for me →"}
              </button>
              <button
                onClick={surpriseMe} disabled={loading}
                className="px-5 py-3 bg-white border-2 border-orange-200 text-orange-500 rounded-xl text-sm font-bold hover:border-orange-500 hover:bg-orange-50 disabled:opacity-40 transition-all"
              >
                🎲 Surprise me
              </button>
            </div>

            {/* Favorites panel */}
            {showFavorites && (
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden mb-6 animate-fade-up">
                <div className="px-5 py-3 border-b border-stone-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Saved recipes</p>
                </div>
                {savedRecipes.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-stone-400">No saved recipes yet — hit ❤️ on any recipe to save it.</p>
                ) : (
                  <ul className="divide-y divide-stone-50">
                    {savedRecipes.map((r, i) => (
                      <li
                        key={i}
                        onClick={() => { setRecipe(r); setServings(r.servings ?? 2); setShowFavorites(false); }}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-orange-50/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl">{r.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-800 truncate">{r.name}</p>
                            <p className="text-xs text-stone-400">{r.time} · {r.difficulty}</p>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); unsaveRecipe(r.name); setSavedRecipesState(getSavedRecipes()); }}
                          className="text-stone-300 hover:text-red-400 text-xs flex-shrink-0 transition-colors"
                        >✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Recipe card */}
            {recipe && !loading && (
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden animate-fade-up">

                {/* Recipe header */}
                <div className="px-6 py-6 border-b border-stone-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-4xl leading-none">{recipe.emoji}</span>
                        {recipe.cuisine && (
                          <span className="text-[11px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full">
                            {recipe.cuisine}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-stone-800 leading-snug">{recipe.name}</h2>
                      <p className="text-sm text-stone-400 mt-1.5 leading-relaxed">{recipe.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <p className="text-xs font-medium text-stone-500">{recipe.time}</p>
                      <p className="text-xs text-stone-400">{recipe.difficulty}</p>
                      {recipe.calories && <p className="text-xs text-stone-400">~{recipe.calories} kcal</p>}
                    </div>
                  </div>

                  {/* Serving adjuster */}
                  <div className="flex items-center gap-3 mt-4">
                    <p className="text-xs text-stone-400 font-medium">Serves</p>
                    <div className="flex items-center gap-2 bg-stone-50 rounded-full px-3 py-1">
                      <button onClick={() => setServings(s => Math.max(1, s - 1))} className="text-stone-400 hover:text-orange-500 font-bold text-sm w-4 transition-colors">−</button>
                      <span className="text-sm font-bold text-stone-700 w-4 text-center">{servings}</span>
                      <button onClick={() => setServings(s => Math.min(12, s + 1))} className="text-stone-400 hover:text-orange-500 font-bold text-sm w-4 transition-colors">+</button>
                    </div>
                    {scale !== 1 && (
                      <p className="text-[11px] text-stone-400">
                        ×{Number.isInteger(scale) ? scale : scale.toFixed(1)} quantities
                      </p>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={toggleSave}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isSaved ? "bg-orange-500 text-white border-orange-500" : "bg-white text-stone-500 border-stone-200 hover:border-orange-300"}`}
                    >{isSaved ? "❤️ Saved" : "🤍 Save"}</button>
                    <button
                      onClick={() => rate("up")}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${currentRating === "up" ? "bg-green-100 border-green-300 text-green-700" : "bg-white text-stone-400 border-stone-200 hover:border-green-300"}`}
                    >👍</button>
                    <button
                      onClick={() => rate("down")}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${currentRating === "down" ? "bg-red-100 border-red-300 text-red-600" : "bg-white text-stone-400 border-stone-200 hover:border-red-200"}`}
                    >👎</button>
                    <button
                      onClick={share}
                      className="ml-auto px-3 py-1.5 rounded-full text-xs border bg-white text-stone-400 border-stone-200 hover:border-orange-300 hover:text-orange-500 transition-all"
                    >{copied ? "✓ Copied!" : "📤 Share"}</button>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="px-6 py-5 border-b border-stone-100 space-y-4">
                  {recipe.matched_ingredients.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">You already have</p>
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
                      <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">You'll need</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.extra_ingredients.map((ing, i) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs border border-stone-200 text-stone-500 bg-stone-50">{ing}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div className="px-6 py-5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4">How to make it</p>
                  <ol className="space-y-4">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-4 text-sm text-stone-700 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-500 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {recipe.gremlin_note && (
                    <div className="mt-6 pt-5 border-t border-stone-100">
                      <p className="text-xs text-stone-400 italic leading-relaxed">
                        🧌 {recipe.gremlin_note}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => generate()}
                    className="w-full border border-orange-100 bg-orange-50 text-orange-400 text-xs font-semibold py-2.5 rounded-xl hover:bg-orange-100 hover:text-orange-600 transition-all"
                  >
                    Try a different one
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="space-y-4 lg:pt-[108px]">

            {/* Pantry */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">My pantry</p>
                <button onClick={() => { setShowPantry(v => !v); setPantryInput(pantryStaples.join(", ")); }}
                  className="text-[11px] text-orange-400 hover:text-orange-600 font-medium transition-colors">
                  {showPantry ? "Cancel" : "Edit"}
                </button>
              </div>
              {showPantry ? (
                <div className="px-4 py-4 space-y-3">
                  <p className="text-xs text-stone-400">Your staples, comma separated</p>
                  <textarea rows={3} value={pantryInput} onChange={e => setPantryInput(e.target.value)}
                    placeholder="olive oil, garlic, salt, onion…"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-300 focus:outline-none focus:border-orange-400 resize-none" />
                  <button onClick={savePantry} className="w-full bg-orange-500 text-white text-xs font-semibold py-2 rounded-xl hover:bg-orange-600 transition-all">
                    Save pantry
                  </button>
                </div>
              ) : (
                <div className="px-4 py-4">
                  {pantryStaples.length === 0 ? (
                    <p className="text-xs text-stone-400 leading-relaxed">Save your staples so you don't retype them every session.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {pantryStaples.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-stone-50 border border-stone-200 text-stone-600">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recipe of the day */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Recipe of the day</p>
                <span className="text-[11px] text-orange-400 font-semibold">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none flex-shrink-0">{dailyRecipe.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800 leading-snug">{dailyRecipe.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{dailyRecipe.time} min · {dailyRecipe.difficulty}</p>
                  </div>
                </div>
                <p className="text-xs text-stone-500 mt-3 leading-relaxed">{dailyRecipe.description}</p>
                <button onClick={() => setShowDailySteps(v => !v)}
                  className="mt-3 text-xs text-orange-400 hover:text-orange-600 font-medium transition-colors">
                  {showDailySteps ? "Hide steps ↑" : "Show steps ↓"}
                </button>
                {showDailySteps && (
                  <ol className="mt-3 space-y-2.5">
                    {dailyRecipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-stone-600 leading-relaxed">
                        <span className="font-bold text-orange-300 flex-shrink-0 mt-px">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100">
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Tips for today</p>
              </div>
              <ul className="px-4 py-4 space-y-3">
                {dailyTips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-stone-500 leading-relaxed">
                    <span className="text-orange-300 font-bold flex-shrink-0">—</span>
                    <span>{tip}</span>
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
