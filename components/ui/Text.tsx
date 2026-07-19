import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type PolymorphicProps<E extends ElementType, P> = P &
  Omit<ComponentPropsWithoutRef<E>, keyof P | "as"> & { as?: E };

type DisplayProps<E extends ElementType = "h1"> = PolymorphicProps<
  E,
  { className?: string; children: ReactNode }
>;

export function Display<E extends ElementType = "h1">({
  as,
  className,
  children,
  ...rest
}: DisplayProps<E>) {
  const Component = as ?? "h1";
  return (
    <Component className={cx("text-display font-normal text-text-primary", className)} {...rest}>
      {children}
    </Component>
  );
}

type HeadingLevel = 1 | 2 | 3 | 4;

const headingTag: Record<HeadingLevel, "h1" | "h2" | "h3" | "h4"> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

const headingClass: Record<HeadingLevel, string> = {
  1: "text-h1",
  2: "text-h2",
  3: "text-h3",
  4: "text-h4",
};

type HeadingProps<E extends ElementType = "h2"> = PolymorphicProps<
  E,
  { level: HeadingLevel; className?: string; children: ReactNode }
>;

export function Heading<E extends ElementType = "h2">({
  level,
  as,
  className,
  children,
  ...rest
}: HeadingProps<E>) {
  const Component = as ?? headingTag[level];
  return (
    <Component className={cx(headingClass[level], "font-normal text-text-primary", className)} {...rest}>
      {children}
    </Component>
  );
}

type BodyProps<E extends ElementType = "p"> = PolymorphicProps<
  E,
  { className?: string; children: ReactNode; muted?: boolean }
>;

export function Body<E extends ElementType = "p">({
  as,
  className,
  muted,
  children,
  ...rest
}: BodyProps<E>) {
  const Component = as ?? "p";
  return (
    <Component
      className={cx(
        "text-body [overflow-wrap:anywhere]",
        muted ? "text-text-muted" : "text-text-primary",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

type LabelProps<E extends ElementType = "span"> = PolymorphicProps<
  E,
  { className?: string; children: ReactNode; uppercase?: boolean }
>;

export function Label<E extends ElementType = "span">({
  as,
  className,
  uppercase = true,
  children,
  ...rest
}: LabelProps<E>) {
  const Component = as ?? "span";
  return (
    <Component
      className={cx("text-label font-medium text-text-muted", uppercase && "uppercase", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

type ProseProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  { className?: string; children: ReactNode }
>;

export function Prose<E extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: ProseProps<E>) {
  const Component = as ?? "div";
  return (
    <Component className={cx("prose max-w-prose text-body text-text-primary", className)} {...rest}>
      {children}
    </Component>
  );
}
