import { describe, expect, it } from "vitest";
import { cycleMemberId } from "../src/game/content/members";

describe("member cycle", () => {
  it("loops through all five PLAVE members in order", () => {
    expect(cycleMemberId("yejun")).toBe("noah");
    expect(cycleMemberId("noah")).toBe("bamby");
    expect(cycleMemberId("bamby")).toBe("eunho");
    expect(cycleMemberId("eunho")).toBe("hamin");
    expect(cycleMemberId("hamin")).toBe("yejun");
  });
});
