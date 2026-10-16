import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'dark' | 'outline' | 'light' | 'whatsapp' | 'danger' | 'ghost';
type Size = 'md' | 'sm' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

function classes({ variant = 'primary', size = 'md', block }: CommonProps, extra?: string) {
  return [styles.btn, styles[variant], styles[size], block && styles.block, extra].filter(Boolean).join(' ');
}

export function Button({
  variant,
  size,
  block,
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes({ variant, size, block, children }, className)} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  icon,
  children,
  className,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={classes({ variant, size, block, children }, className)} {...rest}>
      {icon}
      <span>{children}</span>
    </a>
  );
}
