const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
    const token = req.headers["authorization"];
    if (typeof token !== "undefined") {
        jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.status(403).send("Invalid token");
            } else {
                req.userId = decoded.userId;
                next();
            }
        });
    } else {
        res.status(401).send("Unauthorized");
    }
}

module.exports = {
    verifyToken
}