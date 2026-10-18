import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </label>
      {children}
      {hint ? <p className="text-muted text-xs">{hint}</p> : null}
    </div>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="text-danger text-sm">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="text-sm text-green-500">
        {success}
      </p>
    );
  }
  return null;
}
