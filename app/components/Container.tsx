export type ContainerSize = 'wide' | 'standard' | 'editorial' | 'narrow';

export function Container({
  as = 'div',
  children,
  className = '',
  size = 'standard',
}: {
  as?: 'article' | 'div' | 'main' | 'section';
  children: React.ReactNode;
  className?: string;
  size?: ContainerSize;
}) {
  const Element = as;
  return (
    <Element className={`container container--${size} ${className}`.trim()}>
      {children}
    </Element>
  );
}
