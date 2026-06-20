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
  "When something tastes flat, try acid first (lemon, vinegar) before more salt.",
  "Have everything prepped before you turn on the heat.",
  "A hot pan before adding oil prevents sticking.",
  "Garlic burns in seconds. Add it after onions are already soft.",
  "Dried herbs go in early. Fresh herbs go in at the very end.",
  "Season in layers throughout cooking, not just at the end.",
  "Underseasoning is the most common home-cooking mistake.",
  "Deglaze the pan after browning meat — that's where the flavor is.",
  "Let butter foam and settle before adding food.",
  "Don't lift the lid when steaming. Every peek adds time.",
  "Add a pinch of sugar to tomato-based sauces to balance the acidity.",
  "Always taste the dressing before putting it on the salad.",
  "Chop aromatics smaller than everything else so they melt into the dish.",
];

function getDayIndex() { return Math.floor(Date.now() / 86400000); }

export default function Home() {
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
  }, []);

  const pool = cuisine === "All" ? ALL_RECIPES : ALL_RECIPES.filter(r => r.cuisine === cuisine);
  const dailyRecipe = ALL_RECIPES[dayIndex % ALL_RECIPES.length];
  const dailyTips = [0,1,2,3].map(i => COOKING_TIPS[(dayIndex + i) % COOKING_TIPS.length]);

  function getPool() {
    return cuisine === "All" ? ALL_RECIPES : ALL_RECIPES.filter(r => r.cuisine === cuisine);
  }

  function validateIngredients(value: string) {
    if (!challenge) return value;
    const parts = value.split(",").filter(s => s.trim());
    if (parts.length > 3) {
      setError("Challenge mode: max 3 ingredients!");
      return parts.slice(0, 3).join(", ");
    }
    return value;
  }

  async function generate(ingredientOverride?: string) {
    const ing = ingredientOverride ?? ingredients;
    if (!ing.trim()) { setError("Add some ingredients first."); return; }
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const result = matchRecipe(ing, dietary, timeLimit, level, getPool());
      setRecipe(result);
      setServings(result.servings ?? 2);
      const newStreak = markCookedToday();
      setStreak(newStreak);
      setSavedRecipesState(getSavedRecipes());
      setRatingsState(getRatings());
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  }

  function surpriseMe() {
    const p = getPool();
    const idx = getNextSurpriseIndex(p.length, `cookle_rotation_${cuisine}`);
    const picked = p[idx];
    const userIng = ingredients.trim() ? ingredients : "";
    const userIngredients = userIng.toLowerCase().split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    const result = resolveRecipe(picked, userIngredients);
    setRecipe(result);
    setServings(result.servings ?? 2);
    const newStreak = markCookedToday();
    setStreak(newStreak);
    setSavedRecipesState(getSavedRecipes());
  }

  function toggleSave() {
    if (!recipe) return;
    if (isRecipeSaved(recipe.name)) {
      unsaveRecipe(recipe.name);
    } else {
      saveRecipe(recipe);
    }
    setSavedRecipesState(getSavedRecipes());
  }

  function rate(r: "up" | "down") {
    if (!recipe) return;
    const current = ratings[recipe.name];
    const next = current === r ? null : r;
    setRating(recipe.name, next);
    setRatingsState(getRatings());
  }

  function savePantry() {
    const staples = pantryInput.split(",").map(s => s.trim()).filter(Boolean);
    setPantryStaples(staples);
    setPantryStapleState(staples);
    setShowPantry(false);
  }

  function loadPantry() {
    if (pantryStaples.length === 0) return;
    const existing = ingredients.trim();
    const pantryStr = pantryStaples.join(", ");
    setIngredients(existing ? `${existing}, ${pantryStr}` : pantryStr);
  }

  async function share() {
    if (!recipe) return;
    const text = `🧌 ${recipe.name}\n${recipe.description}\n\nMade with Cookle`;
    if (navigator.share) {
      await navigator.share({ title: recipe.name, text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isSaved = recipe ? isRecipeSaved(recipe.name) : false;
  const currentRating = recipe ? ratings[recipe.name] : undefined;
  const servingScale = servings / (recipe?.servings ?? 2);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">

        {/* ── LEFT ── */}
        <div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                🧌 <span className="text-orange-500">Cookle</span>
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">Tell it what you have. It decides.</p>
            </div>
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                  🔥 {streak} day{streak > 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={() => setShowFavorites(v => !v)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${showFavorites ? "bg-orange-500 text-white border-orange-500" : "text-gray-500 border-gray-200 hover:border-orange-400"}`}
              >
                ❤️ {savedRecipes.length > 0 ? savedRecipes.length : "Saved"}
              </button>
            </div>
          </div>

          {/* Cuisine selector */}
          <div className="mb-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Cuisine</p>
            <div className="flex flex-wrap gap-1.5">
              {CUISINES.map(c => (
                <button key={c} onClick={() => setCuisine(c)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${cuisine === c ? "bg-orange-500 text-white border-orange-500" : "text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                What's in your fridge?{challenge && " (max 3)"}
              </label>
              {pantryStaples.length > 0 && (
                <button onClick={loadPantry} className="text-xs text-orange-500 hover:text-orange-700 transition-colors">
                  + Load pantry
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={ingredients}
              onChange={e => setIngredients(validateIngredients(e.target.value))}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
              placeholder="chicken, garlic, tomatoes, pasta..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Dietary</p>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setDietary(opt)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${dietary === opt ? "bg-orange-500 text-white border-orange-500" : "text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Time</p>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setTimeLimit(opt)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${timeLimit === opt ? "bg-orange-500 text-white border-orange-500" : "text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Chef level</p>
              <div className="flex flex-wrap gap-1.5">
                {LEVEL_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setLevel(opt)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${level === opt ? "bg-orange-500 text-white border-orange-500" : "text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Challenge toggle */}
          <div className="mb-5">
            <button onClick={() => setChallenge(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${challenge ? "bg-orange-500 text-white border-orange-500" : "text-gray-500 border-gray-200 hover:border-orange-400"}`}>
              🎯 Challenge mode {challenge ? "ON — max 3 ingredients" : "OFF"}
            </button>
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button onClick={() => generate()} disabled={loading}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-sm font-semibold tracking-wide hover:bg-orange-600 disabled:opacity-40 transition-all">
              {loading ? "Deciding..." : "Decide for me →"}
            </button>
            <button onClick={surpriseMe} disabled={loading}
              className="px-5 py-3 border-2 border-orange-200 text-orange-500 rounded-xl text-sm font-semibold hover:border-orange-500 hover:bg-orange-50 disabled:opacity-40 transition-all">
              🎲 Surprise me
            </button>
          </div>

          {/* Saved recipes panel */}
          {showFavorites && (
            <div className="mt-6 border border-orange-100 rounded-2xl overflow-hidden animate-fade-up">
              <div className="px-5 py-4 border-b border-orange-50">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Saved recipes</p>
              </div>
              {savedRecipes.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">No saved recipes yet. Hit ❤️ on a recipe to save it.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {savedRecipes.map((r, i) => (
                    <li key={i} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setRecipe(r); setServings(r.servings ?? 2); setShowFavorites(false); }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{r.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.time} · {r.difficulty}</p>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); unsaveRecipe(r.name); setSavedRecipesState(getSavedRecipes()); }}
                        className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Recipe card */}
          {recipe && !loading && (
            <div className="mt-8 border border-gray-100 rounded-2xl overflow-hidden animate-fade-up">

              {/* Top */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-3xl leading-none">{recipe.emoji}</span>
                      {recipe.cuisine && (
                        <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                          {recipe.cuisine}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mt-2 leading-snug">{recipe.name}</h2>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{recipe.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-1 pt-1">
                    <p className="text-xs text-gray-400">{recipe.time}</p>
                    <p className="text-xs text-gray-400">{recipe.difficulty}</p>
                    {recipe.calories && <p className="text-xs text-gray-400">~{recipe.calories} kcal</p>}
                  </div>
                </div>

                {/* Serving size */}
                <div className="flex items-center gap-3 mt-4">
                  <p className="text-xs text-gray-400">Serves</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setServings(s => Math.max(1, s - 1))}
                      className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 text-xs hover:border-orange-400 hover:text-orange-500 transition-all flex items-center justify-center">−</button>
                    <span className="text-sm font-semibold text-gray-800 w-4 text-center">{servings}</span>
                    <button onClick={() => setServings(s => Math.min(12, s + 1))}
                      className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 text-xs hover:border-orange-400 hover:text-orange-500 transition-all flex items-center justify-center">+</button>
                  </div>
                  {servingScale !== 1 && (
                    <p className="text-xs text-gray-400">
                      (×{servingScale % 1 === 0 ? servingScale : servingScale.toFixed(1)} quantities)
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={toggleSave}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${isSaved ? "bg-orange-500 text-white border-orange-500" : "text-gray-500 border-gray-200 hover:border-orange-400"}`}>
                    {isSaved ? "❤️ Saved" : "🤍 Save"}
                  </button>
                  <button onClick={() => rate("up")}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${currentRating === "up" ? "bg-green-100 border-green-300 text-green-700" : "text-gray-500 border-gray-200 hover:border-green-300"}`}>
                    👍
                  </button>
                  <button onClick={() => rate("down")}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${currentRating === "down" ? "bg-red-100 border-red-300 text-red-600" : "text-gray-500 border-gray-200 hover:border-red-200"}`}>
                    👎
                  </button>
                  <button onClick={share}
                    className="ml-auto px-3 py-1.5 rounded-full text-xs border border-gray-200 text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-all">
                    {copied ? "✓ Copied!" : "📤 Share"}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {recipe.matched_ingredients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">You have</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.matched_ingredients.map((ing, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs bg-orange-500 text-white">{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
                {recipe.extra_ingredients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">You'll need</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.extra_ingredients.map((ing, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500">{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Steps</p>
                  <ol className="space-y-3">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                        <span className="text-xs font-bold text-orange-300 w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                {recipe.gremlin_note && (
                  <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-4">
                    🧌 {recipe.gremlin_note}
                  </p>
                )}
              </div>

              <div className="px-6 pb-6">
                <button onClick={() => generate()}
                  className="w-full border border-orange-100 text-orange-400 text-xs py-2.5 rounded-xl hover:border-orange-300 hover:text-orange-600 transition-all">
                  Try a different one
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="space-y-5 lg:pt-[120px]">

          {/* Pantry manager */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">My pantry</p>
              <button onClick={() => setShowPantry(v => !v)}
                className="text-xs text-orange-400 hover:text-orange-600 transition-colors">
                {showPantry ? "Cancel" : "Edit"}
              </button>
            </div>
            {showPantry ? (
              <div className="px-4 py-4 space-y-3">
                <p className="text-xs text-gray-400">List your staples, comma separated</p>
                <textarea rows={3} value={pantryInput}
                  onChange={e => setPantryInput(e.target.value)}
                  placeholder="olive oil, garlic, salt, onion..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 resize-none"
                />
                <button onClick={savePantry}
                  className="w-full bg-orange-500 text-white text-xs py-2 rounded-xl hover:bg-orange-600 transition-all">
                  Save pantry
                </button>
              </div>
            ) : (
              <div className="px-4 py-4">
                {pantryStaples.length === 0 ? (
                  <p className="text-xs text-gray-400">Save your staples so you don't retype them every time.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {pantryStaples.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-600">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recipe of the day */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Recipe of the day</p>
              <span className="text-xs text-orange-400 font-medium">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none flex-shrink-0">{dailyRecipe.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{dailyRecipe.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{dailyRecipe.time} min · {dailyRecipe.difficulty}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">{dailyRecipe.description}</p>
              <button onClick={() => setShowDailySteps(v => !v)}
                className="mt-3 text-xs text-orange-400 hover:text-orange-600 transition-colors">
                {showDailySteps ? "Hide steps ↑" : "Show steps ↓"}
              </button>
              {showDailySteps && (
                <ol className="mt-3 space-y-2">
                  {dailyRecipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                      <span className="font-bold text-orange-300 flex-shrink-0">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Tips for today</p>
            </div>
            <ul className="px-4 py-4 space-y-3">
              {dailyTips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-gray-500 leading-relaxed">
                  <span className="text-orange-300 flex-shrink-0 font-bold">—</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

        </aside>
      </div>
    </main>
  );
}
