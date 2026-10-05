import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: false, // false for 2525/587 (STARTTLS), true only for port 465
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

export async function sendVerificationEmail(to: string, url: string) {
	// auth.ts calls this without awaiting, so errors must be caught here.
	// Otherwise a failed send becomes an unhandled rejection and Node
	// shuts the whole server down.
	try {
		await transporter.sendMail({
			from: `"snitch." <${process.env.SMTP_USER}>`,
			to,
			subject: "Verify your email — snitch.",
			html: `
				<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
					<h2 style="color: #E8171F;">snitch.</h2>
					<p>Click the button below to verify your university email and activate your account.</p>
					<a href="${url}" style="display: inline-block; background: #E8171F; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
						Verify email
					</a>
					<p style="color: #666; font-size: 13px;">If the button doesn't work, copy and paste this link:</p>
					<p style="color: #666; font-size: 13px; word-break: break-all;">${url}</p>
				</div>
			`,
		});
		console.log(`Verification email sent to ${to}`);
	} catch (err) {
		console.error("Failed to send verification email:", err);
	}
}