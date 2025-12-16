import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { depositSuccessTemplate, NotificationData } from "@/app/utils/notificationTemplates";

export async function POST(request: Request) {
    try {
        const body: NotificationData = await request.json();
        const { chainOrigen, chainDestino, amountSend, asset, txHash, emailSender } = body;

        // Basic Validation
        if (!chainOrigen || !chainDestino || !amountSend || !asset || !txHash || !emailSender) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate Template
        const notification = depositSuccessTemplate(body);

        // Check Credentials
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Email credentials missing. Notification will not be sent.");
            return NextResponse.json({
                success: true,
                message: "Notification skipped (missing credentials)",
                preview: notification
            });
        }

        // Create Transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const recipient = "tinsaurralde17@gmail.com"; // Overriding recipient for demonstration

        // Send Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipient,
            subject: notification.title,
            text: notification.body,
            html: notification.html,
        });

        return NextResponse.json({
            success: true,
            message: `Notification sent to ${recipient}`,
            preview: notification
        });

    } catch (error) {
        console.error("Error processing notification:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
