"use client";

import { useEffect, useMemo, useState } from "react";

type RoleSelectorProps = {
  onSelect: (roleKey: string) => void;
};

const ROLE_OPTIONS = [
  { label: "Full Stack Engineer", key: "full_stack" },
  { label: "Frontend Engineer", key: "frontend" },
  { label: "Backend Engineer", key: "backend" },
  { label: "Data Scientist", key: "data_scientist" },
  { label: "DevOps / SRE", key: "devops" },
  { label: "Product Manager", key: "product_manager" },
] as const;

const LEVEL_OPTIONS = [
  { label: "Junior (0–2 yrs)", key: "junior" },
  { label: "Mid (2–5 yrs)", key: "mid" },
  { label: "Senior (5+ yrs)", key: "senior" },
] as const;

const VALID_ROLE_KEYS = new Set<string>([
  "full_stack_junior",
  "full_stack_senior",
  "frontend_junior",
  "backend_junior",
  "data_scientist_junior",
  "devops_junior",
  "product_manager",
]);

const FALLBACK_ROLE_KEY = "full_stack_junior";

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const computedRoleKey = useMemo(() => {
    if (!selectedRole || !selectedLevel) {
      return null;
    }
    const candidate = `${selectedRole}_${selectedLevel}`;
    return VALID_ROLE_KEYS.has(candidate) ? candidate : FALLBACK_ROLE_KEY;
  }, [selectedRole, selectedLevel]);

  useEffect(() => {
    if (computedRoleKey) {
      onSelect(computedRoleKey);
    }
  }, [computedRoleKey, onSelect]);

  return (
    <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Choose your target role</h2>
      <p className="mt-1 text-sm text-slate-600">
        Select a role and level before opening the resume editor.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRole === role.key;
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => setSelectedRole(role.key)}
              className={[
                "rounded-xl border bg-white px-4 py-4 text-left transition",
                "hover:border-blue-300 hover:bg-blue-50",
                isSelected ? "border-blue-500 ring-2 ring-blue-500" : "border-slate-200",
              ].join(" ")}
            >
              <span className="text-sm font-medium text-slate-900">{role.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {LEVEL_OPTIONS.map((level) => {
          const isSelected = selectedLevel === level.key;
          return (
            <button
              key={level.key}
              type="button"
              onClick={() => setSelectedLevel(level.key)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                "hover:border-blue-300 hover:bg-blue-50",
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500"
                  : "border-slate-300 text-slate-700",
              ].join(" ")}
            >
              {level.label}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-slate-600">
        Your score will be tailored to this role and level
      </p>
    </section>
  );
}

export default RoleSelector;
