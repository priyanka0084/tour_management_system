// middlewares/authmiddleware.js
const jwt = require("jsonwebtoken");


// Middleware: verify JWT and admin role
module.exports.verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }


    const token = authHeader.split(" ")[1]; // "Bearer <token>"
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }


    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // Check if user is admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }


    // Attach user to request for later use
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", error });
  }
};


