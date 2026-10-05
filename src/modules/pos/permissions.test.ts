import { describe, expect, it } from "vitest";
import { assignableRoles, can, canAccess, homeFor, permissionFor, ROLES } from "./permissions";

describe("permissions", () => {
  it("keeps money and menu away from floor staff", () => {
    for (const r of ["waiter", "bartender", "kitchen"] as const) {
      expect(can(r, "payment.record")).toBe(false);
      expect(can(r, "menu.edit")).toBe(false);
      expect(can(r, "order.void")).toBe(false);
    }
    expect(can("cashier", "payment.record")).toBe(true);
    expect(can("cashier", "menu.edit")).toBe(false);
  });

  it("only the platform admin manages client restaurants", () => {
    expect(ROLES.filter((r) => can(r, "tenants.manage"))).toEqual(["admin"]);
  });

  it("the platform admin supports a restaurant but never takes orders or money", () => {
    expect(can("admin", "menu.edit")).toBe(true);
    expect(can("admin", "order.take")).toBe(false);
    expect(can("admin", "payment.record")).toBe(false);
  });

  it("maps routes to permissions, longest prefix first", () => {
    expect(permissionFor("/pos/mesa/s1")).toBe("order.take");
    expect(permissionFor("/menu")).toBe("menu.edit");
    expect(permissionFor("/menus")).toBeNull();
    expect(canAccess("waiter", "/menu")).toBe(false);
    expect(canAccess("waiter", "/pos/mesa/s1")).toBe(true);
    expect(canAccess(undefined, "/creditos")).toBe(true);
  });

  it("every role lands on a screen it can open", () => {
    for (const r of ROLES) expect(canAccess(r, homeFor(r))).toBe(true);
  });

  it("nobody assigns a role at or above their own, except the admin creating owners", () => {
    expect(assignableRoles("manager")).not.toContain("manager");
    expect(assignableRoles("owner")).not.toContain("owner");
    expect(assignableRoles("waiter")).toEqual([]);
    expect(assignableRoles("admin")).toContain("owner");
  });
});
