"use client";

import { useState, useEffect, useRef } from "react";
import { matchRecipe } from "@/lib/recipes";
import type { ResolvedRecipe } from "@/lib/recipes";

type Recipe = ResolvedRecipe;

const DIETARY_OPTIONS = ["None", "Vegetarian", "Vegan", "Gluten-free", "Keto", "Dairy-free", "Halal"];
const TIME_OPTIONS = ["15 mins", "30 mins", "45 mins", "1 hour", "No limit"];

const LOADING_MESSAGES = [
  "🔍 Inspecting your fridge...",
  "🧌 The kitchen gremlin is thinking...",
  "🥄 Stirring up ideas...",
  "🔥 Getting chaotic in the kitchen...",
  "✨ Almost there...",
  "🍳 Taste-testing in our heads...",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard: "bg-red-100 text-red-700",
};

export default function Home() {
  const [ingredients, setIngredients] = useState("");
  const [dietary, setDietary] = useState("None");
  const [timeLimit, setTimeLimit] = useState("30 mins");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [msgIndex, setMsgIndex] = useState(0);
  const recipeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setMsgIndex((i) => {
        const next = (i + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[next]);
        return next;
      });
    }, 1600);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (recipe) {
      setTimeout(() => recipeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [recipe]);

  async function generateRecipe() {
    if (!ingredients.trim()) {
      setError("Tell me what's in your fridge first!");
      return;
    }
    setError(null);
    setLoading(true);
    setMsgIndex(0);
    setLoadingMessage(LOADING_MESSAGES[0]);

    // Brief gremlin animation delay
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const result = matchRecipe(ingredients, dietary, timeLimit);
      setRecipe(result);
    } catch {
      setError("The gremlin got confused. Try again!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-orange-500 text-white px-6 py-5 shadow-md">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🧌</span>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Cookle</h1>
              <p className="text-orange-100 text-sm font-medium">
                A kitchen gremlin lives in your fridge. Let it decide.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {/* Ingredients Input */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            🥕 What&apos;s in your fridge?
          </label>
          <textarea
            className="w-full rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none p-3 text-gray-800 resize-none text-base transition-colors"
            rows={3}
            placeholder="e.g. chicken, garlic, tomatoes, pasta, an egg that might be fine..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Just list what you have — the gremlin handles the rest.</p>
        </section>

        {/* Dietary Preference */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            🌿 Dietary preference
          </p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setDietary(opt)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  dietary === opt
                    ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                    : "bg-white border-orange-200 text-gray-600 hover:border-orange-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        {/* Time Limit */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            ⏱️ How much time do you have?
          </p>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setTimeLimit(opt)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  timeLimit === opt
                    ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                    : "bg-white border-orange-200 text-gray-600 hover:border-orange-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
            😬 {error}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={generateRecipe}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-all duration-150 tracking-tight"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin-slow inline-block">🧌</span>
              {loadingMessage}
            </span>
          ) : (
            "DECIDE FOR ME →"
          )}
        </button>

        {/* Recipe Card */}
        {recipe && !loading && (
          <div ref={recipeRef} className="animate-bounce-in">
            <div className="bg-white rounded-2xl shadow-md border-2 border-orange-200 overflow-hidden">
              {/* Recipe Header */}
              <div className="bg-gradient-to-r from-orange-400 to-amber-400 px-6 py-5 text-white">
                <div className="text-5xl mb-2">{recipe.emoji}</div>
                <h2 className="text-2xl font-black tracking-tight">{recipe.name}</h2>
                <p className="text-orange-50 mt-1 text-sm leading-relaxed">{recipe.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ⏱ {recipe.time}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      DIFFICULTY_COLORS[recipe.difficulty] ?? "bg-white/20 text-white"
                    }`}
                  >
                    {recipe.difficulty}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Matched Ingredients */}
                {recipe.matched_ingredients?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      ✅ You already have
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recipe.matched_ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-3 py-1 rounded-full"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Ingredients */}
                {recipe.extra_ingredients?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      🛒 Grab these too
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recipe.extra_ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium px-3 py-1 rounded-full"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                {recipe.steps?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                      👨‍🍳 How to make it
                    </p>
                    <ol className="space-y-3">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-black">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Gremlin Note */}
                {recipe.gremlin_note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm italic">
                    🧌 <em>{recipe.gremlin_note}</em>
                  </div>
                )}
              </div>
            </div>

            {/* Regenerate */}
            <button
              onClick={generateRecipe}
              className="mt-4 w-full border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600 font-bold text-base py-3 rounded-2xl transition-all duration-150"
            >
              😤 Nope, try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
