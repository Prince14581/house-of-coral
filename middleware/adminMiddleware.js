const isAdmin = (req, res, next) => {
    // req.user is populated by your authentication middleware
    if (req.user && req.user.roles.includes('admin')) {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};

module.exports = isAdmin;
