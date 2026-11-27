// fee-ledger.js — accrual ledger for the V3 smoke payment demo.
//
// Every fee event is appended to an in-memory ledger with a running
// balance per asset. Entries are immutable once written; corrections
// are new compensating entries, never edits, so the history replays
// exactly. The ledger is the demo's source of truth for payouts.

export class FeeLedger {
  constructor() {
    this.entries = [];
    this.balances = new Map();
    this.sequence = 0;
  }

  record({ asset, amount, kind, reference }) {
    if (!asset) throw new Error("asset required");
    if (typeof amount !== "bigint") throw new Error("amount must be bigint");
    if (amount <= 0n) throw new Error("amount must be positive");
    if (!["accrual", "payout", "reversal"].includes(kind)) {
      throw new Error(`unknown entry kind: ${kind}`);
    }
    const entry = {
      seq: ++this.sequence,
      asset,
      amount,
      kind,
      reference: reference ?? null,
      at: new Date().toISOString(),
    };
    this.entries.push(Object.freeze(entry));
    const delta = kind === "payout" ? -amount : amount;
    this.balances.set(asset, (this.balances.get(asset) ?? 0n) + delta);
    return entry;
  }

  balanceOf(asset) {
    return this.balances.get(asset) ?? 0n;
  }

  entriesFor(asset) {
    return this.entries.filter((e) => e.asset === asset);
  }

  replay(asset) {
    let sum = 0n;
    for (const e of this.entriesFor(asset)) {
      sum += e.kind === "payout" ? -e.amount : e.amount;
    }
    return sum;
  }

  assertConsistent(asset) {
    if (this.replay(asset) !== this.balanceOf(asset)) {
      throw new Error(`ledger drift detected for ${asset}`);
    }
    return true;
  }
}
