import {forwardRef} from 'react';
import {Icon, type IconName} from '~/components/Icon';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  label: string;
  badge?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {badge, className = '', icon, label, type = 'button', ...props},
    ref,
  ) {
    return (
      <button
        {...props}
        aria-label={label}
        className={`icon-button ${className}`.trim()}
        ref={ref}
        type={type}
      >
        <Icon name={icon} />
        {typeof badge === 'number' && badge > 0 ? (
          <span className="icon-button__badge" aria-hidden>
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </button>
    );
  },
);
