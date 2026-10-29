import { pool } from "../config/db.js";
import { enquirySchema, enquiryIdSchema } from "../validators/enquiryValidators.js";

function formatEnquiry(row) {
  return {
    id: String(row.id),
    studentName: row.student_name,
    email: row.email,
    phone: row.phone,
    course: row.course,
    message: row.message,
    claimedBy: row.claimed_by === null ? null : String(row.claimed_by),
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
  };
}

export async function createEnquiry(req, res, next) {
  try {
    const parsed = enquirySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const { studentName, email, phone, course, message } = parsed.data;

    const result = await pool.query(
      `INSERT INTO enquiries
         (student_name, email, phone, course, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentName, email.toLowerCase(), phone, course, message ?? null]
    );

    return res.status(201).json({
      message: "Enquiry submitted successfully",
      enquiry: formatEnquiry(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function listUnclaimed(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT * FROM enquiries
       WHERE claimed_by IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 100`
    );

    return res.json({
      count: result.rows.length,
      enquiries: result.rows.map(formatEnquiry),
    });
  } catch (error) {
    next(error);
  }
}

export async function claimEnquiry(req, res, next) {
  try {
    const parsedId = enquiryIdSchema.safeParse(req.params.id);

    if (!parsedId.success) {
      return res.status(400).json({ error: "Invalid enquiry ID" });
    }

    const id = parsedId.data.toString();

    const result = await pool.query(
      `UPDATE enquiries
       SET claimed_by = $1, claimed_at = NOW()
       WHERE id = $2 AND claimed_by IS NULL
       RETURNING *`,
      [req.employeeId, id]
    );

    if (result.rows.length) {
      return res.json({
        message: "Lead claimed successfully",
        enquiry: formatEnquiry(result.rows[0]),
      });
    }

    const existing = await pool.query(
      "SELECT claimed_by FROM enquiries WHERE id = $1",
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Enquiry not found" });
    }

    return res.status(409).json({
      error: "Lead has already been claimed",
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyEnquiries(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT * FROM enquiries
       WHERE claimed_by = $1
       ORDER BY claimed_at DESC, id DESC
       LIMIT 100`,
      [req.employeeId]
    );

    return res.json({
      count: result.rows.length,
      enquiries: result.rows.map(formatEnquiry),
    });
  } catch (error) {
    next(error);
  }
}