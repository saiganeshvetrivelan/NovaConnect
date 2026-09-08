const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'novaconnect_demo_secret_2026';

const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid Token" });
    }
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
        }
        next();
    };
};

module.exports = {verifyAuth, verifyRole};
