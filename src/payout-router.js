// payout-router.js — routes accrued fees to recipients by share.
//
// Shares are basis points that must sum to exactly 10000. Rounding
// dust from integer division is assigned to the largest shareholder
// so a payout always distributes the full accrued amount and the
// ledger returns to zero for the paid asset.

import { FeeLedger } from "./fee-ledger.js";

export class PayoutRouter {
  constructor(ledger = new FeeLedger()) {
    this.ledger = ledger;
    this.recipients = [];
  }

  addRecipient(address, shareBps) {
    if (!address) throw new Error("recipient address required");
    if (!Number.isInteger(shareBps) || shareBps <= 0 || shareBps > 10000) {
      throw new Error("shareBps must be an integer in 1..10000");
    }
    this.recipients.push({ address, shareBps });
    const total = this.recipients.reduce((s, r) => s + r.shareBps, 0);
    if (total > 10000) throw new Error("shares exceed 10000 bps");
    return this;
  }

  validateShares() {
    const total = this.recipients.reduce((s, r) => s + r.shareBps, 0);
    if (total !== 10000) throw new Error(`shares sum to ${total}, need 10000`);
    return true;
  }

  planPayout(asset) {
    this.validateShares();
    const total = this.ledger.balanceOf(asset);
    if (total <= 0n) throw new Error("nothing accrued for " + asset);
    const plan = this.recipients.map((r) => ({
      address: r.address,
      amount: (total * BigInt(r.shareBps)) / 10000n,
    }));
    const planned = plan.reduce((s, p) => s + p.amount, 0n);
    const dust = total - planned;
    if (dust > 0n) {
      let largest = 0;
      for (let i = 1; i < plan.length; i++) {
        if (plan[i].amount > plan[largest].amount) largest = i;
      }
      plan[largest].amount += dust;
    }
    return plan;
  }

  executePayout(asset, reference) {
    const plan = this.planPayout(asset);
    for (const p of plan) {
      this.ledger.record({
        asset, amount: p.amount, kind: "payout",
        reference: `${reference}:${p.address}`,
      });
    }
    this.ledger.assertConsistent(asset);
    return plan;
  }
}
