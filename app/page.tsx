"use client";

import { useState, useEffect } from "react";
import { matchRecipe, RECIPES } from "@/lib/recipes";
import type { ResolvedRecipe } from "@/lib/recipes";

type Recipe = ResolvedRecipe;

const DIETARY_OPTIONS = ["None", "Vegetarian", "Vegan", "Gluten-free", "Keto", "Dairy-free", "Halal"];
const TIME_OPTIONS = ["15 mins", "30 mins", "45 mins", "1 hour", "No limit"];

const COOKING_TIPS = [
  "Salt your pasta water until it tastes like the sea.",
  "Pat meat completely dry before searing — moisture kills a good crust.",
  "Rest meat for a few minutes before slicing or all the juices run out.",
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
  "Underseasoning is the most common home-cooking mistake. Be bolder with salt.",
  "Deglaze the pan with wine or stock after browning meat — that's where the flavor is.",
  "Let butter foam and settle before adding food — that's when the pan is ready.",
  "Don't lift the lid when steaming or simmering. Every peek adds time.",
  "Chop aromatics (onion, garlic) smaller than everything else so they melt into the dish.",
  "Add a pinch of sugar to tomato-based sauces to balance the acidity.",
  "Always taste the dressing before putting it on the salad.",
];

function getDayIndex() {
  return Math.floor(Date.now() / 86400000);
}

export default function Home() {
  const [ingredients, setIngredients] = useState("");
  const [dietary, setDietary] = useState("None");
  const [timeLimit, setTimeLimit] = useState("30 mins");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDailySteps, setShowDailySteps] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);

  useEffect(() => {
    setDayIndex(getDayIndex());
  }, []);

  const dailyRecipe = RECIPES[dayIndex % RECIPES.length];
  const dailyTips = [0, 1, 2, 3].map(
    (i) => COOKING_TIPS[(dayIndex + i) % COOKING_TIPS.length]
  );

  async function generateRecipe() {
    if (!ingredients.trim()) {
      setError("Add some ingredients first.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    try {
      setRecipe(matchRecipe(ingredients, dietary, timeLimit));
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">

        {/* ── LEFT: Main ── */}
        <div>
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">🧌 <span className="text-orange-500">Cookle</span></h1>
            <p className="text-sm text-gray-400 mt-1">
              Tell it what you have. It tells you what to cook.
            </p>
          </div>

          {/* Ingredients */}
          <div className="mb-5">
            <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
              What's in your fridge?
            </label>
            <textarea
              rows={3}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateRecipe();
                }
              }}
              placeholder="chicken, garlic, tomatoes, pasta, an egg..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none transition-colors"
            />
          </div>

          {/* Diet + Time */}
          <div className="grid grid-cols-2 gap-5 mb-7">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                Dietary
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDietary(opt)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      dietary === opt
                        ? "bg-orange-500 text-white border-orange-500"
                        : "text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                Time
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setTimeLimit(opt)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      timeLimit === opt
                        ? "bg-orange-500 text-white border-orange-500"
                        : "text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          {/* CTA */}
          <button
            onClick={generateRecipe}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl text-sm font-semibold tracking-wide hover:bg-orange-600 disabled:opacity-40 transition-all"
          >
            {loading ? "Deciding..." : "Decide for me →"}
          </button>

          {/* Recipe Result */}
          {recipe && !loading && (
            <div className="mt-10 border border-gray-100 rounded-2xl overflow-hidden animate-fade-up">
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-4xl leading-none">{recipe.emoji}</span>
                    <h2 className="text-lg font-bold text-gray-900 mt-3 leading-snug">
                      {recipe.name}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-1 pt-1">
                    <p className="text-xs text-gray-400">{recipe.time}</p>
                    <p className="text-xs text-gray-400">{recipe.difficulty}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {recipe.matched_ingredients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                      You have
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.matched_ingredients.map((ing, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs bg-orange-500 text-white">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recipe.extra_ingredients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                      You'll need
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.extra_ingredients.map((ing, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">
                    Steps
                  </p>
                  <ol className="space-y-3">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                        <span className="text-xs font-bold text-orange-300 w-4 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
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
                <button
                  onClick={generateRecipe}
                  className="w-full border border-orange-100 text-orange-400 text-xs py-2.5 rounded-xl hover:border-orange-300 hover:text-orange-600 transition-all"
                >
                  Try a different one
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <aside className="space-y-6 lg:pt-[88px]">

          {/* Recipe of the Day */}
          {dailyRecipe && (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                  Recipe of the day
                </p>
                <span className="text-xs text-orange-400 font-medium">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none flex-shrink-0">{dailyRecipe.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {dailyRecipe.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dailyRecipe.time} min · {dailyRecipe.difficulty}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  {dailyRecipe.description}
                </p>

                <button
                  onClick={() => setShowDailySteps((v) => !v)}
                  className="mt-3 text-xs text-orange-400 hover:text-orange-600 transition-colors"
                >
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
          )}

          {/* Cooking Tips */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                Tips for today
              </p>
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
