"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export interface MenuItemConfig {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface MenuProps {
  label: string;
  items: MenuItemConfig[];
  tone?: "light" | "dark";
}

/** Keyboard arrows (Up/Down/Home/End), dismiss on outside click/Escape with
 *  focus restored to the trigger. Typeahead is optional per this prompt's
 *  spec and was left out to keep scope tight. */
export function Menu({ label, items, tone = "light" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openMenu(startIndex = 0) {
    setActiveIndex(startIndex);
    setOpen(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(items.length - 1);
    }
  }

  function handleItemKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(items.length - 1);
    }
  }

  function selectItem(item: MenuItemConfig) {
    if (item.disabled) return;
    item.onSelect();
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu(0))}
        onKeyDown={handleTriggerKeyDown}
        className="btn btn-secondary control-focus"
      >
        {label}
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          className={`menu-panel shadow-elevated ${tone === "dark" ? "surface-inverse" : "surface-page"}`}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              data-active={index === activeIndex}
              className="menu-item control-focus"
              tabIndex={-1}
              onClick={() => selectItem(item)}
              onKeyDown={(event) => handleItemKeyDown(event, index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
