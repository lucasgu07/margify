"use client";

import type { AdvisorRecommendation, RecommendationCategory } from "@/lib/ai-advisor/recommendation-types";
import { CATEGORY_LABELS } from "@/lib/ai-advisor/recommendation-types";

type CategoryFilterProps = {
  recommendations: AdvisorRecommendation[];
  selected: RecommendationCategory | "all";
  onChange: (cat: RecommendationCategory | "all") => void;
};

export function CategoryFilter({ recommendations, selected, onChange }: CategoryFilterProps) {
  // Count per category
  const counts = recommendations.reduce<Partial<Record<RecommendationCategory, number>>>(
    (acc, rec) => {
      if (rec.category) acc[rec.category] = (acc[rec.category] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const categories = Object.entries(counts) as [RecommendationCategory, number][];
  categories.sort((a, b) => b[1] - a[1]);

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
          selected === "all"
            ? "bg-[#64DFDF] text-black"
            : "border border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
        }`}
      >
        Todas
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
            selected === "all" ? "bg-black/20 text-black" : "bg-white/10"
          }`}
        >
          {recommendations.length}
        </span>
      </button>
      {categories.map(([cat, count]) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
            selected === cat
              ? "bg-[#64DFDF] text-black"
              : "border border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
          }`}
        >
          {CATEGORY_LABELS[cat]}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              selected === cat ? "bg-black/20 text-black" : "bg-white/10"
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}
