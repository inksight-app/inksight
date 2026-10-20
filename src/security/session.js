/** Invalidates in-flight work even when A logs out and immediately logs back in. */
export class SessionBoundary {
  constructor() { this.userId = null; this.generation = 0; }
  change(userId) {
    const next = userId || null;
    if (next === this.userId) return false;
    this.userId = next; this.generation += 1; return true;
  }
  capture() { return { userId: this.userId, generation: this.generation }; }
  isCurrent(ticket) { return ticket.userId === this.userId && ticket.generation === this.generation; }
  assertCurrent(ticket) { if (!this.isCurrent(ticket)) throw new Error('Compte modifié : opération annulée.'); }
}
