import { useCallback, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";

// Bump this whenever you change the terms materially.
export const TERMS_VERSION = "1.0";
const LAST_UPDATED = "October 2026";
// TODO: replace with a real address you check. Takedown requests go here.
const CONTACT_EMAIL = "your-email@example.com";

type Section = { title: string; body: string[] };

const SECTIONS: Section[] = [
	{
		title: "1. Acceptance of these Terms",
		body: [
			"By creating an account on, accessing, or using snitch. (the \"Platform\"), you confirm that you have read, understood, and agree to be legally bound by these Terms and Conditions (the \"Terms\"). If you do not agree with any part of these Terms, you must not create an account or use the Platform.",
			"Clicking \"I agree\" below constitutes your electronic signature and your binding acceptance of these Terms. These Terms apply to every visitor and registered user of the Platform.",
		],
	},
	{
		title: "2. Who we are and what the Platform is",
		body: [
			"The Platform is an independent, student-built, user-driven website that allows verified university students to share personal experiences and opinions about working with other students on academic group projects. The Platform is operated by an individual (the \"Operator\") and is not affiliated with, endorsed by, sponsored by, or connected to any university, institution, student body, or government entity.",
			"The Platform is a neutral venue. The Operator does not create, write, edit, verify, or endorse the content that users post.",
		],
	},
	{
		title: "3. Eligibility and account requirements",
		body: [
			"You may use the Platform only if you are a current or former student of a supported university, you are legally capable of entering into a binding agreement under the laws that apply to you, and you register with a valid, official university email address that you own and control.",
			"You agree to provide accurate registration information and to keep your login credentials confidential. You are fully responsible for all activity that takes place under your account. Notify the Operator promptly if you suspect unauthorised use.",
			"You may not create accounts on behalf of others, share accounts, impersonate another person, or create multiple accounts to evade restrictions or manipulate ratings.",
		],
	},
	{
		title: "4. All content is personal opinion",
		body: [
			"Everything posted on the Platform, including names, student IDs, star ratings, written descriptions, and comments (\"User Content\"), is the subjective personal opinion, experience, or perception of the individual user who posted it. User Content is not a statement of fact by the Operator, and ratings and averages are simple arithmetic summaries of opinions, not assessments, evaluations, or conclusions of any kind.",
			"Different people can experience the same situation very differently. A rating or review reflects one person's view at one point in time and may be incomplete, outdated, exaggerated, mistaken, or biased.",
			"You should never rely on User Content as the sole basis for any decision about another person. You are solely responsible for how you interpret and use anything you read on the Platform.",
		],
	},
	{
		title: "5. No verification of accuracy",
		body: [
			"The Operator does not investigate, fact-check, verify, or vouch for the truth, accuracy, completeness, fairness, or legality of any User Content, nor the identity, intent, or authenticity of any person who posts or is mentioned. Verification of a university email address confirms only that the user controlled an email address at that domain; it does not confirm the truth of anything the user writes.",
			"The Operator makes no representation that any person named on the Platform is correctly identified, that a student name and ID genuinely belong together, or that any account of events is accurate.",
		],
	},
	{
		title: "6. You are solely responsible for what you post",
		body: [
			"You are solely and entirely responsible for the User Content you submit, including any legal consequences that arise from it. By posting, you represent and warrant that: (a) your content is based on your genuine, first-hand experience; (b) you believe in good faith that it is truthful; (c) it is expressed as your honest opinion or account, not as a claim of fact you know to be false; (d) it does not violate any law or the rights of any third party; and (e) you have the right to submit it.",
			"Statements of fact that you cannot support, accusations of criminal or illegal conduct, and claims you know or suspect to be false must not be posted. If you are unsure whether something is true, do not post it.",
		],
	},
	{
		title: "7. Prohibited conduct and content",
		body: [
			"You agree not to post, upload, or transmit content that: is knowingly false, fabricated, or misleading; makes false allegations or spreads rumours about any person; defames, slanders, or libels any person; harasses, bullies, threatens, intimidates, or incites violence or hatred against any person or group; is discriminatory on grounds such as religion, ethnicity, gender, disability, appearance, or background; is sexually explicit, obscene, or exploits or endangers minors; reveals private or sensitive personal information about others, such as phone numbers, home addresses, social media accounts, financial or medical details, or private messages (\"doxxing\"); is posted out of revenge, personal vendetta, or to settle a score unrelated to a genuine academic group experience; is posted to artificially inflate or damage a person's rating, including coordinated or repeated posting; impersonates any person or misrepresents your relationship with them; or infringes intellectual property or privacy rights.",
			"You also agree not to attempt to access other accounts or non-public areas of the Platform, interfere with its operation, scrape or harvest its data in bulk, introduce malicious code, bypass any restriction or security feature, or use the Platform for any unlawful purpose.",
		],
	},
	{
		title: "8. Disclaimer regarding disputes, feuds, and real-world consequences",
		body: [
			"Because the Platform involves opinions about real people, disagreements may arise. You understand and accept that content on the Platform may cause disputes, arguments, feuds, social conflict, embarrassment, distress, reputational harm, academic or professional consequences, or other harm, whether to you or to others, online or offline.",
			"The Operator is not a party to any dispute between users, between a user and a person mentioned on the Platform, or between any other persons. The Operator does not mediate, arbitrate, resolve, or take responsibility for any such dispute, and is not responsible for any act, reaction, retaliation, or conduct of any person that follows from content on the Platform, including conduct that occurs outside the Platform.",
			"You agree to resolve any conflict that arises from your use of the Platform directly with the relevant individual and not with the Operator. If you feel unsafe or threatened, contact the appropriate authorities.",
		],
	},
	{
		title: "9. False information, allegations, and misuse",
		body: [
			"The Platform is open to misuse by users who may post false, misleading, malicious, or exaggerated content. The Operator does not control what users post and cannot guarantee that no inaccurate or harmful content will appear. The Operator expressly disclaims all responsibility and liability for any false information, false allegations, defamatory statements, or malicious content posted by any user, and for any consequences of such content.",
			"If you believe content about you is false or harmful, your remedy is to use the reporting process in Section 12 and, where you consider it appropriate, to pursue the user who posted it. Posting, or the Platform's hosting of, such content does not mean the Operator agrees with it.",
		],
	},
	{
		title: "10. Public visibility of your information",
		body: [
			"By posting, you understand and consent that your account name and associated details, such as your university email address where displayed, may be visible to other users and the public alongside your posts, reviews, and edits. The Platform is designed for accountability: anonymity is not guaranteed.",
			"Student names and student IDs entered about third parties become part of publicly searchable content. Do not post information about another person unless you are comfortable standing behind it under your own name.",
		],
	},
	{
		title: "11. Your licence to the Platform and our licence to your content",
		body: [
			"You retain ownership of the User Content you create. By submitting it, you grant the Operator a worldwide, non-exclusive, royalty-free, transferable, sublicensable licence to host, store, display, reproduce, adapt, and distribute that content in connection with operating, promoting, and improving the Platform, for as long as the content remains on the Platform and for a reasonable period afterwards for backup and legal purposes.",
			"The Platform's design, code, name, and branding belong to the Operator. You receive a limited, personal, revocable, non-transferable permission to use the Platform in accordance with these Terms.",
		],
	},
	{
		title: "12. Moderation, reporting, and removal",
		body: [
			"The Operator may, but has no obligation to, monitor, review, edit, restrict, or remove any User Content, and may suspend or terminate any account, at any time and at the Operator's sole discretion, with or without notice, including for any suspected breach of these Terms or for any reason the Operator considers appropriate to protect the Platform or its users.",
			`If you believe content violates these Terms or your rights, contact ${CONTACT_EMAIL} with the link to the content, what you believe is wrong, and why. The Operator will review good-faith reports within a reasonable time but does not guarantee any particular outcome or timeline. The failure to remove any content is not an endorsement of it and does not create any liability.`,
			"The Operator's decisions on moderation are final. Rating and review features, including the single permitted edit per review, may be changed or removed at any time.",
		],
	},
	{
		title: "13. Indemnification",
		body: [
			"You agree to defend, indemnify, and hold harmless the Operator, together with any contributors, hosts, and service providers (collectively the \"Protected Parties\"), from and against any and all claims, demands, actions, damages, losses, liabilities, judgments, settlements, costs, and expenses, including reasonable legal fees, arising out of or related to: (a) your User Content; (b) your use or misuse of the Platform; (c) your breach of these Terms or any law; or (d) your violation of the rights of any third party, including any claim of defamation, harassment, invasion of privacy, or infringement.",
			"This obligation survives the termination of your account and these Terms.",
		],
	},
	{
		title: "14. Disclaimer of warranties",
		body: [
			"The Platform and all content on it are provided \"as is\" and \"as available\", without warranties of any kind, express or implied, including any warranties of accuracy, reliability, completeness, merchantability, fitness for a particular purpose, non-infringement, security, or uninterrupted or error-free operation.",
			"The Operator does not warrant that the Platform will be available at any time, that data will not be lost, or that the Platform will be free of errors, bugs, or harmful components. The Platform may be modified, suspended, or discontinued at any time without notice or liability.",
		],
	},
	{
		title: "15. Limitation of liability",
		body: [
			"To the fullest extent permitted by applicable law, the Protected Parties shall not be liable for any direct, indirect, incidental, special, consequential, exemplary, or punitive damages, or any loss of reputation, goodwill, opportunity, data, profit, or academic or employment prospects, arising out of or in connection with the Platform, any User Content, any dispute or feud between persons, any reliance on information from the Platform, any unauthorised access to your account, or any other matter relating to the Platform, even if advised of the possibility of such damages.",
			"Where liability cannot be excluded by law, the total aggregate liability of the Protected Parties for all claims is limited to the greater of the amount you paid to use the Platform (which is nothing, as the Platform is free) or a nominal sum permitted by law.",
		],
	},
	{
		title: "16. Third-party services and links",
		body: [
			"The Platform relies on third-party services such as hosting, databases, and email delivery. The Operator is not responsible for the acts, omissions, outages, security incidents, or policies of any third party. Any links to external sites are provided for convenience only and are not endorsements.",
		],
	},
	{
		title: "17. Privacy and data",
		body: [
			"To operate the Platform, the Operator collects and stores information you provide, including your name, university email address, your university affiliation, your password in hashed form, and the content you post, together with limited technical data such as session information, IP address, and browser details for security and functionality.",
			"This information is used to provide and secure the Platform, verify eligibility, prevent abuse, enforce these Terms, and comply with legal obligations. Information may be disclosed where required by law, court order, or lawful request by authorities, or where the Operator reasonably believes disclosure is necessary to protect rights, safety, or the Platform. Although reasonable measures are used to protect data, no system is completely secure and the Operator cannot guarantee absolute security.",
			"You may request deletion of your account by contacting the Operator. Content you have posted may be removed, anonymised, or retained at the Operator's discretion where needed for legal, safety, or integrity reasons.",
		],
	},
	{
		title: "18. Account suspension and termination",
		body: [
			"The Operator may suspend or terminate your access at any time, with or without cause or notice. You may stop using the Platform at any time. Sections that by their nature should survive termination, including Sections 4 to 9, 11, 13, 15, 19, and 20, will survive.",
		],
	},
	{
		title: "19. Governing law and disputes",
		body: [
			"These Terms are governed by the laws of the People's Republic of Bangladesh, without regard to conflict-of-law principles. You agree that any dispute with the Operator arising from these Terms or the Platform will be subject to the exclusive jurisdiction of the competent courts in Dhaka, Bangladesh, to the extent permitted by law. You agree to first attempt to resolve any dispute informally by contacting the Operator.",
			"Nothing in these Terms limits any right you have under applicable law that cannot be waived.",
		],
	},
	{
		title: "20. General provisions",
		body: [
			"These Terms are the entire agreement between you and the Operator regarding the Platform and replace any earlier understanding. If any provision is found invalid or unenforceable, the remaining provisions remain in full effect. A failure to enforce any right is not a waiver of it. You may not assign your rights under these Terms; the Operator may assign them freely.",
			"The Operator may update these Terms from time to time. Material changes will be reflected by updating the version and date at the top of these Terms, and your continued use after a change constitutes acceptance of the updated Terms. If you do not agree with a change, you must stop using the Platform.",
		],
	},
	{
		title: "21. Your acknowledgement",
		body: [
			"By clicking \"I agree\", you confirm that you have read and understood these Terms; that you understand the Platform contains unverified personal opinions; that you are solely responsible for your own posts and for how you use what you read; that the Operator is not responsible for disputes, feuds, false information, or any resulting harm; and that you voluntarily accept these Terms.",
		],
	},
];

export function TermsModal({
	open,
	onOpenChange,
	onAgree,
	loading,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAgree: () => void;
	loading: boolean;
}) {
	const [scrolledToEnd, setScrolledToEnd] = useState(false);

	// Runs each time the scroll area mounts (i.e. each time the modal opens).
	// If the content isn't tall enough to scroll, the button is enabled at once.
	const scrollRef = useCallback((el: HTMLDivElement | null) => {
		if (el) setScrolledToEnd(el.scrollHeight - el.clientHeight <= 8);
	}, []);

	function handleScroll(e: React.UIEvent<HTMLDivElement>) {
		const el = e.currentTarget;
		if (el.scrollHeight - el.scrollTop - el.clientHeight <= 8) {
			setScrolledToEnd(true);
		}
	}

	return (
		<Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Terms and Conditions</DialogTitle>
					<DialogDescription className="text-xs">
						Version {TERMS_VERSION} · Last updated {LAST_UPDATED}. Please read
						carefully and scroll to the bottom to continue.
					</DialogDescription>
				</DialogHeader>

				<div
					ref={scrollRef}
					onScroll={handleScroll}
					className="max-h-[50vh] space-y-4 overflow-y-auto rounded-md border border-border p-4 text-[11px] leading-relaxed text-muted-foreground"
				>
					{SECTIONS.map((s) => (
						<section key={s.title} className="space-y-1.5">
							<h3 className="text-xs font-semibold text-foreground">
								{s.title}
							</h3>
							{s.body.map((p) => (
								<p key={p.slice(0, 40)}>{p}</p>
							))}
						</section>
					))}
				</div>

				{!scrolledToEnd && (
					<p className="text-center text-[11px] text-muted-foreground">
						Scroll to the bottom to enable the agree button.
					</p>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						variant="custom"
						onClick={onAgree}
						disabled={!scrolledToEnd || loading}
					>
						{loading ? "Creating account..." : "I agree"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}