import { z } from "zod";

export const enquirySchema = z.object({
  studentName: z.string().trim().min(2).max(120),
  email: z.email().trim().max(255),
  phone: z.string().trim().min(7).max(30),
  course: z.string().trim().min(2).max(150),
  message: z.string().trim().max(5000).optional(),
}).strict();

export const enquiryIdSchema = z.coerce.bigint()
  .positive();