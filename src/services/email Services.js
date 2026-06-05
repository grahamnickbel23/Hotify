import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendEmail = async ({ target, subject, template, data }) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MY_EMAIL,
            pass: process.env.MY_APP_PASSWORD,
        },
    });

    const templatePath = path.join(
        __dirname,
        "../templates",
        `${template}.html`
    );

    let html = await fs.readFile(
        templatePath,
        "utf-8"
    );

    // Replace dynamic placeholders
    for (const [key, value] of Object.entries(data)) {
        html = html.replaceAll(
            `{{${key}}}`,
            String(value)
        );
    }

    const info = await transporter.sendMail({
        from: `"Hotify Bot" <${process.env.MY_EMAIL}>`,
        to: target,
        subject,
        html,
    });

    return info;
};