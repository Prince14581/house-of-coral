const eventBus = require('../../../shared/events/event.bus');
const SettlementService = require('../../../core/settlement/services/settlement.service');
const TradeContract = require('../models/TradeContract');

eventBus.on('SHIPMENT_DELIVERED', async (data) => {
    const contract = await TradeContract.findById(data.contractId);
    
    // Auto-settlement
    await SettlementService.executeSettlement(contract);
    
    // Update Contract Status
    contract.status = 'SETTLED';
    await contract.save();
    
    console.log(`[Settlement] Trade ${data.contractId} settled automatically.`);
});
