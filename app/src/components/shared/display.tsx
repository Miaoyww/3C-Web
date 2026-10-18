"use client";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { Button } from "@/components/ui/button";
import type { Tone } from "@/types/domain";

export function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span className={`status status-${tone}`}>
      <i />
      {children}
    </span>
  );
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function MetricNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const reduced = useReducedMotion();
  return reduced ? (
    <span data-slot="counting-number">{value.toFixed(decimals)}</span>
  ) : (
    <CountingNumber number={value} decimalPlaces={decimals} initiallyStable />
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-field">
      <Search size={16} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * pageSize + 1}—${Math.min(page * pageSize, total)}`
          : "0"}{" "}
        / 共 {total} 条
      </span>
      <div>
        <Button
          aria-label="上一页"
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft />
        </Button>
        <span>
          {page} / {pages}
        </span>
        <Button
          aria-label="下一页"
          variant="outline"
          size="icon-sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="empty-state">
      <Search size={24} />
      <p>{children}</p>
    </div>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="resident-avatar" aria-hidden="true">
      {name.slice(-2)}
    </span>
  );
}
