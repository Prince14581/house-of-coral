// src/modules/Governance/ProposalService.js
const Proposal = require('./models/Proposal');
const Identity = require('../Identity/IdentityModel');
const TreasuryService = require('../Treasury/TreasuryService');

class ProposalService {
    static async castVote(userId, proposalId, voteChoice) {
        const proposal = await Proposal.findById(proposalId);
        if (proposal.status !== 'ACTIVE') throw new Error('Proposal closed');

        // Fetch User and calculate weight
        const user = await Identity.findOne({ userId });
        const weight = user.trustScore;

        // Apply Vote
        const vote = voteChoice === 'PRO' ? 'results.pro' : 'results.contra';
        await Proposal.updateOne(
            { _id: proposalId },
            { 
                $inc: { [vote]: weight },
                $push: { voters: { userId, vote: voteChoice } }
            }
        );
    }

    static async finalize(proposalId) {
        const proposal = await Proposal.findById(proposalId);
        // Business Logic: If Pro > Contra, mark passed
        if (proposal.results.pro > proposal.results.contra) {
            proposal.status = 'PASSED';
            await proposal.save();
            
            // If it's a funding proposal, trigger the Treasury
            if (proposal.type === 'FUNDING') {
                // Logic to release funds to proposer
                await TreasuryService.releaseFunds(proposal.proposerId, proposal.amount);
            }
        }
    }
}

module.exports = ProposalService;
