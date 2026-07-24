import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProviderGuide } from "@/components/app/imports/ProviderGuide";

describe("ProviderGuide", () => {
  it("lists all 8 real platforms the worker/parsers actually support", () => {
    render(<ProviderGuide platform="telegram" onSelect={vi.fn()} lang="EN" />);

    for (const label of ["Telegram", "Gmail", "WhatsApp", "Instagram", "Messenger", "Slack", "Discord", "Manual"]) {
      expect(screen.getByRole("radio", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("marks the active platform via aria-checked and shows its own export steps", () => {
    render(<ProviderGuide platform="telegram" onSelect={vi.fn()} lang="EN" />);

    expect(screen.getByRole("radio", { name: /Telegram/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Gmail/ })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText('Choose "Export chat history."')).toBeInTheDocument();
  });

  it("selecting a different provider calls onSelect with that platform", async () => {
    const onSelect = vi.fn();
    render(<ProviderGuide platform="telegram" onSelect={onSelect} lang="EN" />);

    await userEvent.click(screen.getByRole("radio", { name: /WhatsApp/ }));
    expect(onSelect).toHaveBeenCalledWith("whatsapp");
  });

  it("shows honest, provider-accurate guidance instead of overclaiming bespoke support for platforms the parser only handles generically", () => {
    render(<ProviderGuide platform="slack" onSelect={vi.fn()} lang="EN" />);
    expect(screen.getByText(/Altr reads the resulting JSON generically/)).toBeInTheDocument();
  });

  it("never points to a workaround or third-party export tool — only each provider's own official one", () => {
    render(<ProviderGuide platform="discord" onSelect={vi.fn()} lang="EN" />);
    expect(screen.getByText(/Request all of my data/)).toBeInTheDocument();
  });
});
