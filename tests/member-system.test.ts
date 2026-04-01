import { describe, expect, it } from "vitest";
import { MEMBER_ORDER, MEMBER_PROFILES } from "../src/game/content/members";
import { MemberSystem } from "../src/game/simulation/member-system";
import type { SimulationEvent } from "../src/game/simulation/types";

describe("MemberSystem", () => {
  it("applies tag cooldown and rotates active member order", () => {
    const events: SimulationEvent[] = [];
    const system = new MemberSystem({
      profiles: MEMBER_PROFILES,
      order: MEMBER_ORDER,
      startingMemberId: "yejun",
      tagCooldownMs: 1000
    });

    expect(system.activeMemberId).toBe("yejun");

    const firstTag = system.tryTagNext(10, (event) => events.push(event));
    expect(firstTag).toBe(true);
    expect(system.activeMemberId).toBe("noah");
    expect(system.cooldownMs).toBe(1000);

    const blockedTag = system.tryTagNext(15, (event) => events.push(event));
    expect(blockedTag).toBe(false);
    expect(system.activeMemberId).toBe("noah");

    system.update(1000);
    const secondTag = system.tryTagNext(1200, (event) => events.push(event));
    expect(secondTag).toBe(true);
    expect(system.activeMemberId).toBe("bamby");

    expect(events.map((event) => event.type)).toEqual(["tag_switched", "tag_switched"]);
  });
});
