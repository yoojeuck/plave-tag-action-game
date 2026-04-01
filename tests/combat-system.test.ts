import { describe, expect, it } from "vitest";
import { MEMBER_PROFILES } from "../src/game/content/members";
import { CombatSystem } from "../src/game/simulation/combat-system";
import type { EnemyState, RunState, SimulationEvent } from "../src/game/simulation/types";

function createRunState(): RunState {
  return {
    segmentIndex: 0,
    hpShared: 240,
    combo: 0,
    tagCooldownMs: 0,
    score: 0,
    clearState: "running"
  };
}

function createEnemy(): EnemyState {
  return {
    id: 1,
    hp: 260,
    maxHp: 260,
    breakGauge: 90,
    maxBreakGauge: 90,
    isBoss: false
  };
}

describe("CombatSystem", () => {
  it("updates combo and score when attacks land", () => {
    const combat = new CombatSystem();
    const runState = createRunState();
    const enemy = createEnemy();
    const events: SimulationEvent[] = [];

    const first = combat.tryNormalAttack({
      profile: MEMBER_PROFILES.yejun,
      enemy,
      runState,
      atMs: 10,
      emit: (event) => events.push(event)
    });

    expect(first.enemyDefeated).toBe(false);
    expect(runState.combo).toBe(1);
    expect(runState.score).toBeGreaterThan(0);
    expect(enemy.hp).toBeLessThan(enemy.maxHp);
    expect(events.at(-1)?.type).toBe("attack_landed");
  });

  it("applies invulnerability frames and down state on repeated hits", () => {
    const combat = new CombatSystem();
    const runState = createRunState();
    const events: SimulationEvent[] = [];
    combat.update(1400);

    const firstHit = combat.tryEnemyPressure({
      profile: MEMBER_PROFILES.eunho,
      runState,
      atMs: 100,
      emit: (event) => events.push(event)
    });
    const hpAfterFirst = runState.hpShared;

    const blockedHit = combat.tryEnemyPressure({
      profile: MEMBER_PROFILES.eunho,
      runState,
      atMs: 200,
      emit: (event) => events.push(event)
    });

    expect(firstHit).toBe(true);
    expect(blockedHit).toBe(false);
    expect(runState.hpShared).toBe(hpAfterFirst);

    for (let i = 0; i < 8; i += 1) {
      combat.update(1000);
      combat.tryEnemyPressure({
        profile: MEMBER_PROFILES.eunho,
        runState,
        atMs: 1500 + i * 1000,
        emit: (event) => events.push(event)
      });
      if (combat.isPlayerDown) {
        break;
      }
    }

    expect(combat.isPlayerDown).toBe(true);
    expect(runState.hpShared).toBe(0);
    expect(events.some((event) => event.type === "player_down")).toBe(true);
  });
});
