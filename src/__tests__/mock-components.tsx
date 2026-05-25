import { createElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';

type MotionOnlyProps = {
  animate?: unknown;
  exit?: unknown;
  initial?: unknown;
  transition?: unknown;
  variants?: unknown;
  viewport?: unknown;
  whileHover?: unknown;
  whileInView?: unknown;
  whileTap?: unknown;
};

type MotionMockProps<T extends keyof React.JSX.IntrinsicElements> =
  ComponentPropsWithoutRef<T> &
    MotionOnlyProps & {
      children?: ReactNode;
    };

const MOTION_PROP_NAMES: Array<keyof MotionOnlyProps> = [
  'animate',
  'exit',
  'initial',
  'transition',
  'variants',
  'viewport',
  'whileHover',
  'whileInView',
  'whileTap',
];

export function motionTag<T extends keyof React.JSX.IntrinsicElements>(tag: T) {
  return function MockMotionComponent({ children, ...props }: MotionMockProps<T>) {
    const domProps = { ...props } as Record<string, unknown>;
    for (const propName of MOTION_PROP_NAMES) {
      delete domProps[propName];
    }

    return createElement(tag, domProps, children);
  };
}

export function MockAnimatePresence({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

type MockImageProps = ComponentPropsWithoutRef<'img'> & {
  fill?: boolean;
  priority?: boolean;
};

export function MockImage({ alt, fill: _fill, priority: _priority, ...props }: MockImageProps) {
  return createElement('img', {
    ...props,
    alt: alt ?? 'Mocked image',
  });
}

type MockLinkProps = ComponentPropsWithoutRef<'a'> & {
  href: string;
  children?: ReactNode;
};

export function MockLink({ children, href, ...props }: MockLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
