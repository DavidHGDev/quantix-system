import dotenv from 'dotenv/config'
import z from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    PASSWORD: z.string()
})

const envParse = envSchema.safeParse(process.env);

if(!envParse.success){
    console.error('error al leer las variables de entorno');
    console.error(envParse.error.format());
    process.exit(1);
}

export const env = envParse.data;