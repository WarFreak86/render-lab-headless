import {forwardRef} from 'react';
import {Link, type LinkProps} from 'react-router';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
}

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

export function ButtonLink({
  children,
  className = '',
  icon,
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={`button button--${variant} ${className}`.trim()}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className = '',
      disabled,
      icon,
      loading = false,
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        className={`button button--${variant} ${className}`.trim()}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        ref={ref}
        type={type}
      >
        {loading ? <span className="button__spinner" aria-hidden /> : icon}
        <span>{children}</span>
      </button>
    );
  },
);
