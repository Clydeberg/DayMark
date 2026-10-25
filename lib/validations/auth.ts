import { z } from "zod";

export const registerSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2, "Name must be at least 2 characters").max(80, "Name must be 80 characters or fewer"),
  email: z.email({ error: "Enter a valid email address" }).trim().toLowerCase(),
  password: z.string({ error: "Password is required" }).min(8, "Password must be at least 8 characters").max(100, "Password must be 100 characters or fewer"),
});
