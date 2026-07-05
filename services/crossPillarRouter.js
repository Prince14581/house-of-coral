const EventBus = require('./pubSubService');

class CrossPillarRouter {
  // Routes events between pillars
  async route(event) {
    const { from, to, payload } = event;
    console.log(`Routing event from ${from} to ${to}`);
    
    // Publish to the specific pillar's listener
    await EventBus.publish(`${to}.incoming`, {
      origin: from,
      data: payload,
      timestamp: Date.now()
    });
  }
}

module.exports = new CrossPillarRouter();
