import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type PolymorphicProps<E extends ElementType, P> = P &
  Omit<ComponentPropsWithoutRef<E>, keyof P | "as"> & { as?: E };

type SurfaceVariant = "page" | "inverse" | "fog";

const variantClass: Record<SurfaceVariant, string> = {
  page: "surface-page",
  inverse: "surface-inverse",
  fog: "surface-fog",
};

type SurfaceProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  { variant: SurfaceVariant; className?: string; children?: ReactNode }
>;

/**
 * `fog` is decorative and absolutely positioned (inset: 0, pointer-events:
 * none) — render it inside a `position: relative` container, as an overlay
 * alongside real content, not as the content itself.
 */
export function Surface<E extends ElementType = "div">({
  variant,
  as,
  className,
  children,
  ...rest
}: SurfaceProps<E>) {
  const Component = as ?? "div";
  return (
    <Component className={cx(variantClass[variant], className)} {...rest}>
      {children}
    </Component>
  );
}

type HairlineSide = "top" | "bottom" | "left" | "right";

type HairlineProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  { side: HairlineSide; className?: string; children?: ReactNode }
>;

export function Hairline<E extends ElementType = "div">({
  side,
  as,
  className,
  children,
  ...rest
}: HairlineProps<E>) {
  const Component = as ?? "div";
  return (
    <Component className={cx(`hairline-${side}`, className)} {...rest}>
      {children}
    </Component>
  );
}
