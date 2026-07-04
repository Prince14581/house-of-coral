// src/modules/Identity/roles/PermissionManager.js
const canPerformAction = (user, action) => {
    const permissions = {
        'LIST_ITEM': { minTrust: 300, roles: ['USER', 'MODERATOR'] },
        'CREATE_TOURNAMENT': { minTrust: 700, roles: ['PRO_USER', 'MODERATOR'] },
        'RESOLVE_DISPUTE': { roles: ['MODERATOR', 'ADMIN'] }
    };

    const requirement = permissions[action];
    const hasRole = requirement.roles.includes(user.role);
    const hasTrust = user.trustScore >= (requirement.minTrust || 0);

    return hasRole && hasTrust;
};
