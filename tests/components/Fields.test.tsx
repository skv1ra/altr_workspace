import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField } from "@/components/ui/PasswordField";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";

describe("TextField", () => {
  it("associates its label with the input", () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("announces its error via role=alert and wires aria-describedby/aria-invalid", () => {
    render(<TextField label="Email" error="Enter a valid email address." />);
    const input = screen.getByLabelText("Email");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid email address.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("renders disabled but keeps the field in the accessibility tree", () => {
    render(<TextField label="Email" disabled />);
    expect(screen.getByLabelText("Email")).toBeDisabled();
  });
});

describe("PasswordField", () => {
  it("associates its label and defaults to a masked input with the required autoComplete", () => {
    render(<PasswordField label="Password" autoComplete="new-password" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "new-password");
  });

  it("toggles visibility via the show/hide button", async () => {
    render(<PasswordField label="Password" autoComplete="current-password" />);
    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    await userEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });
});

describe("Select", () => {
  const options = [
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
  ];

  it("associates its label and lists the given options", () => {
    render(<Select label="Category" options={options} />);
    const select = screen.getByLabelText("Category");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Personal" })).toBeInTheDocument();
  });

  it("supports keyboard selection", async () => {
    render(<Select label="Category" options={options} />);
    const select = screen.getByLabelText("Category") as HTMLSelectElement;
    select.focus();
    await userEvent.selectOptions(select, "personal");
    expect(select.value).toBe("personal");
  });
});
