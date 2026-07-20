import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "@/components/ui/Checkbox";

describe("Checkbox", () => {
  it("associates its label and toggles on click", async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Accept terms" checked={false} onChange={onChange} />);
    const checkbox = screen.getByLabelText("Accept terms");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("toggles on keyboard (Space)", async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Accept terms" checked={false} onChange={onChange} />);
    const checkbox = screen.getByLabelText("Accept terms");
    checkbox.focus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reflects the indeterminate prop on the underlying input", () => {
    render(<Checkbox label="Select all" checked={false} indeterminate onChange={() => {}} />);
    const checkbox = screen.getByLabelText("Select all") as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  it("announces its error via role=alert", () => {
    render(
      <Checkbox label="Required permission" checked={false} onChange={() => {}} error="Confirm this permission." />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Confirm this permission.");
  });
});
