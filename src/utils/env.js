import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1, "VITE_API_BASE_URL is required"),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
