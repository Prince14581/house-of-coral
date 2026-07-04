// src/modules/Governance/proposal/ProposalService.js
class ProposalService {
    static async castVote(userId, proposalId, vote) {
        const identity = await Identity.findOne({ userId });
        
        // Voting power = user's trust score
        const votingWeight = identity.trustScore;

        await Proposal.updateOne(
            { _id: proposalId },
            { $inc: { [`results.${vote}`]: votingWeight } }
        );
    }
}
