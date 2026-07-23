export type Rule = {
  id: string;
  mistakeTypeId: string;
  threshold: number;
  title: string;
  deadlineDays: number;
};

export function nextOccurrence(previousCount: number) {
  if (!Number.isInteger(previousCount) || previousCount < 0) {
    throw new Error("previousCount must be a non-negative integer");
  }
  return previousCount + 1;
}

export function matchingRule(rules: Rule[], mistakeTypeId: string, occurrence: number) {
  return rules.find(
    (rule) =>
      rule.mistakeTypeId === mistakeTypeId && rule.threshold === occurrence,
  );
}

export function penaltyDueDate(createdAt: Date, deadlineDays: number) {
  const due = new Date(createdAt);
  due.setDate(due.getDate() + deadlineDays);
  return due;
}

export function deadlineState(dueDate: Date, now = new Date()) {
  const days = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 2) return "near";
  return "pending";
}
