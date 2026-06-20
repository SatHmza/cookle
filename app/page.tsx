"use client";

import { useState } from "react";
import { matchRecipe } from "@/lib/recipes";
import type { ResolvedRecipe } from "@/lib/recipes";

type Recipe = ResolvedRecipe;

const DIETARY_OPTIONS = ["None", "Vegetarian", "Vegan", "Gluten-free", "Keto", "Dairy-free", "Halal"];
const TIME_OPTIONS = ["15 mins", "30 mins", "45 mins", "1 hour", "No limit"];

export default function Home() {
  const [ingredients, setIngredients] = useState("");
  const [dietary, setDietary] = useState("None");
  const [timeLimit, setTimeLimit] = useState("30 mins");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-lg mx-auto px-6 py-14">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            🧌 Cookle
          </h1>
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
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-900 resize-none transition-colors"
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
                      ? "bg-gray-900 text-white border-gray-900"
                      : "text-gray-500 border-gray-200 hover:border-gray-500"
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
                      ? "bg-gray-900 text-white border-gray-900"
                      : "text-gray-500 border-gray-200 hover:border-gray-500"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={generateRecipe}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold tracking-wide hover:bg-gray-700 disabled:opacity-40 transition-all"
        >
          {loading ? "Deciding..." : "Decide for me →"}
        </button>

        {/* Recipe Card */}
        {recipe && !loading && (
          <div className="mt-10 border border-gray-100 rounded-2xl overflow-hidden animate-fade-up">

            {/* Top */}
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

            {/* Body */}
            <div className="px-6 py-5 space-y-6">

              {/* You have */}
              {recipe.matched_ingredients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                    You have
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.matched_ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs bg-gray-900 text-white"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* You'll need */}
              {recipe.extra_ingredients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                    You'll need
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.extra_ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">
                  Steps
                </p>
                <ol className="space-y-3">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Gremlin note */}
              {recipe.gremlin_note && (
                <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-4">
                  🧌 {recipe.gremlin_note}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={generateRecipe}
                className="w-full border border-gray-100 text-gray-400 text-xs py-2.5 rounded-xl hover:border-gray-300 hover:text-gray-700 transition-all"
              >
                Try a different one
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
