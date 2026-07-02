import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/university/$tag")({
	component: RouteComponent,
});

function RouteComponent() {
	const { tag } = Route.useParams();

	return (
		<>
			<div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 py-5">
				<div className="text-center">
					<h1 className="text-xl font-medium text-foreground">
						Search snitches in{" "}
						<span className="font-bold text-red-600">{tag.toUpperCase()}</span>
					</h1>
				</div>
				<Input
					placeholder="Search by student ID or name..."
					className="w-full max-w-sm"
				/>
			</div>
			<div className="flex items-center justify-center">
				<Button variant="custom">
					Add Snitch
				</Button>
			</div>
			<div className="flex flex-col items-center justify-center py-10">
				Snitches
				<Card className="w-full max-w-sm">
					<CardHeader>
						Name
						<CardDescription>
							Issues
						</CardDescription>
					</CardHeader>	
				</Card>
			</div>
		</>
	);
}
