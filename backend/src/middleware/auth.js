import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = header.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !/^\d+$/.test(String(payload.sub))) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    req.employeeId = String(payload.sub);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}