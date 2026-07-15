import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // The ONE filled, colored surface in the whole app — reserved for the
  // single primary action on a screen. Dark text on the teal reads better
  // than white at this saturation, and keeps it feeling deliberate, not loud.
  primary: "bg-accent text-zinc-950 hover:bg-accent-hover font-medium",
  outline: "border border-zinc-800 text-zinc-100 hover:bg-zinc-900 font-medium",
  ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 font-medium",
  danger: "border border-zinc-800 text-zinc-100 hover:bg-zinc-900 hover:border-zinc-700 font-medium",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  icon: "h-9 w-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "outline", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-colors duration-150",
          "disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
