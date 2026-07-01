// controllers/activityController.js
const { processEscrow } = require('../services/transactionDispatcher');
const Transaction = require('../models/TransactionLog'); // Assuming you have an audit log model

exports.completeTask = async (req, res) => {
    try {
        const { userId, taskId, rewardAmount } = req.body;

        // 1. Validation: Ensure all fields exist
        if (!userId || !taskId || !rewardAmount) {
            return res.status(400).json({ message: "Missing required transaction data." });
        }

        // 2. Idempotency Check: Prevent double-processing
        const existingTx = await Transaction.findOne({ activityId: taskId });
        if (existingTx) {
            return res.status(409).json({ message: "Task reward already processed." });
        }

        // 3. Process through Dispatcher
        const result = await processEscrow({
            senderId: 'SYSTEM_POOL',
            receiverId: userId,
            amount: parseFloat(rewardAmount),
            pillarType: 'TASK_REWARD',
            activityId: taskId
        });

        // 4. Audit Trail: Log this successful transaction
        await Transaction.create({
            activityId: taskId,
            userId,
            amount: rewardAmount,
            status: 'completed',
            timestamp: new Date()
        });

        res.status(200).json({ 
            message: "Task completed. Reward processed.",
            earned: result.earned 
        });
    } catch (err) {
        console.error("Activity Controller Error:", err.message);
        res.status(500).json({ message: "Transaction failed. Please try again later." });
    }
};
