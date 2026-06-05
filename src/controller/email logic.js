import { sendEmail } from "../services/email Services.js";

export const sendEmailLogic = async (req, res) => {

    // get the info for sending email
    const { target, subject, template, data } = req.body;
    if (!target || !subject || !template) return res.status(400).json({ success: false, message: "insufficient information" });

    const result = await sendEmail({
        target,
        subject,
        template,
        data: data || {},
    });

    return res.status(200).json({
        success: true,
        message: "Email sent successfully"
    });
};