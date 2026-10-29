import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";

function validationError(res, result) {
  return res.status(400).json({
    error: "Validation failed",
    details: result.error.flatten(),
  });
}

function publicEmployee(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

function signToken(employee) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { sub: String(employee.id) },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "24h" }
  );
}

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO employees (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    const employee = result.rows[0];

    return res.status(201).json({
      message: "Employee registered successfully",
      employee: publicEmployee(employee),
      token: signToken(employee),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const email = parsed.data.email.toLowerCase();

    const result = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM employees WHERE LOWER(email) = $1`,
      [email]
    );

    const employee = result.rows[0];

    if (!employee || !(await bcrypt.compare(parsed.data.password, employee.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return res.json({
      message: "Login successful",
      employee: publicEmployee(employee),
      token: signToken(employee),
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM employees WHERE id = $1`,
      [req.employeeId]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Employee no longer exists" });
    }

    return res.json({ employee: publicEmployee(result.rows[0]) });
  } catch (error) {
    next(error);
  }
}