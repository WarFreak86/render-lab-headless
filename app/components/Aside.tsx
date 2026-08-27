import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {Drawer} from '~/components/Drawer';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

export function Aside({children, heading, type}: {
  children?: React.ReactNode;
  type: Exclude<AsideType, 'closed'>;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  return (
    <Drawer
      className={`drawer--${type}`}
      onClose={close}
      open={type === activeType}
      placement={type === 'mobile' ? 'left' : 'right'}
      title={heading}
    >
      {children}
    </Drawer>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const close = useCallback(() => setType('closed'), []);
  const value = useMemo(() => ({type, open: setType, close}), [close, type]);
  return <AsideContext.Provider value={value}>{children}</AsideContext.Provider>;
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) throw new Error('useAside must be used within an AsideProvider');
  return aside;
}
