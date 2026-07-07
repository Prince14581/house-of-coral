class OrderAggregate {
  constructor(id, snapshotStore, tenantId, upcaster, config = { snapshotThreshold: 100 }) {
    this.id = id;
    this.tenantId = tenantId;
    this.snapshotStore = snapshotStore;
    this.upcaster = upcaster;
    this.threshold = config.snapshotThreshold;
    this.state = { processedEventIds: new Set(), data: {} };
    this.version = 0;
    this.lastEventId = null;
    this.allowedEventTypes = new Set([
      "OrderCreated", "InventoryReserved", "PaymentAuthorized", 
      "EscrowOpened", "OrderCompleted", "OrderCancelled"
    ]);
  }

  async load(eventStream) {
    const snapshot = await this.snapshotStore.load(this.id);
    if (snapshot) {
      // Robust Snapshot Integrity Validation
      if (snapshot.aggregateId !== this.id || snapshot.tenantId !== this.tenantId || !snapshot.data || !snapshot.schemaVersion) {
        throw new Error("Snapshot integrity failure: invalid or mismatched data");
      }
      
      this.version = snapshot.snapshotVersion;
      this.lastEventId = snapshot.lastEventId;
      this.state = {
        ...snapshot.data,
        processedEventIds: new Set(snapshot.data.processedEventIds || [])
      };
    }

    // Non-mutating sort
    const sortedEvents = [...eventStream].sort((a, b) => a.aggregateVersion - b.aggregateVersion);
    
    // Contiguity check
    for (let i = 0; i < sortedEvents.length; i++) {
        if (i > 0 && sortedEvents[i].aggregateVersion !== sortedEvents[i-1].aggregateVersion + 1) {
            throw new Error(`Gap detected in event stream at version ${sortedEvents[i].aggregateVersion}`);
        }
        if (sortedEvents[i].aggregateVersion > this.version) await this.apply(sortedEvents[i]);
    }
  }

  async apply(event) {
    // 1. Strict Structural & Metadata Validation
    if (!event.eventId || !event.payload || !event.schemaVersion || !event.occurredAt || !event.metadata?.traceId) {
      throw new Error("Malformed event: missing required fields or trace metadata");
    }
    if (event.aggregateId !== this.id) throw new Error("Aggregate mismatch");
    if (event.tenantId !== this.tenantId) throw new Error("Tenant mismatch");
    if (event.aggregateVersion !== this.version + 1) throw new Error('Out of sequence');
    if (!this.allowedEventTypes.has(event.type)) throw new Error(`Unsupported event: ${event.type}`);

    if (this.state.processedEventIds.has(event.eventId)) return;

    const payload = event.schemaVersion < 2 ? this.upcaster.migrate(event.payload) : event.payload;
    
    // 2. Full Domain State Transitions
    switch (event.type) {
      case "OrderCreated":
        this.state.data = { ...this.state.data, ...payload, status: 'CREATED' };
        break;
      case "InventoryReserved":
        this.state.data = { ...this.state.data, status: 'INVENTORY_RESERVED' };
        break;
      case "PaymentAuthorized":
        this.state.data = { ...this.state.data, status: 'PAID' };
        break;
      case "EscrowOpened":
        this.state.data = { ...this.state.data, status: 'ESCROW_ACTIVE' };
        break;
      case "OrderCompleted":
        this.state.data = { ...this.state.data, status: 'COMPLETED' };
        break;
      case "OrderCancelled":
        this.state.data = { ...this.state.data, status: 'CANCELLED' };
        break;
      default:
        throw new Error(`Unhandled event transition: ${event.type}`);
    }

    this.state.processedEventIds.add(event.eventId);
    this.version = event.aggregateVersion;
    this.lastEventId = event.eventId;
    
    await this.maybeSnapshot();
  }

  // ... _deepFreeze and maybeSnapshot remain consistent with previous iteration ...
}
