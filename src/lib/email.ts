export async function sendVerificationEmail(to: string, url: string) {
	// auth.ts calls this without awaiting, so errors must be caught here.
	try {
		const auth = Buffer.from(
			`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`,
		).toString("base64");

		const res = await fetch("https://api.mailjet.com/v3.1/send", {
			method: "POST",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				Messages: [
					{
						From: { Email: process.env.MAIL_FROM, Name: "snitch." },
						To: [{ Email: to }],
						Subject: "Verify your email — snitch.",
						HTMLPart: `
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
					},
				],
			}),
		});

		if (!res.ok) {
			throw new Error(`${res.status} ${await res.text()}`);
		}
		console.log(`Verification email sent to ${to}`);
	} catch (err) {
		console.error("Failed to send verification email:", err);
	}
}