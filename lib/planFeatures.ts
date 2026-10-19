export type PlanSlug = "free" | "pro";

type FeatureKey = "uploadsPerMonth" | "prioritySupport" | "maxDocuments";

type PlanMatrix = {
  name: string;
  description: string;
  features: Record<FeatureKey, number | boolean>;
};

const PLAN_FEATURES: Record<PlanSlug, PlanMatrix> = {
  free: {
    name: "Starter",
    description: "Perfect for getting started with a few PDFs each month.",
    features: {
      uploadsPerMonth: 3,
      maxDocuments: 5,
      prioritySupport: false,
    },
  },
  pro: {
    name: "Pro",
    description: "Unlimited uploads, priority support, and team seats.",
    features: {
      uploadsPerMonth: Infinity,
      maxDocuments: Infinity,
      prioritySupport: true,
    },
  },
};

export function getPlanInfo(slug?: string): PlanMatrix {
  if (slug === "pro") return PLAN_FEATURES.pro;
  return PLAN_FEATURES.free;
}

export function hasFeature(
  slug: string | undefined,
  feature: FeatureKey,
): boolean {
  const plan = slug === "pro" ? PLAN_FEATURES.pro : PLAN_FEATURES.free;
  const value = plan.features[feature];
  return typeof value === "boolean" ? value : value === Infinity;
}

export function getLimit(
  slug: string | undefined,
  feature: FeatureKey,
): number {
  const plan = slug === "pro" ? PLAN_FEATURES.pro : PLAN_FEATURES.free;
  const value = plan.features[feature];
  if (typeof value === "number") {
    return value === Infinity ? Number.POSITIVE_INFINITY : value;
  }
  return value ? Number.POSITIVE_INFINITY : 0;
}
