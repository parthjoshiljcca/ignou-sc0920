import { PageHeader, Card } from "@/components/ui";
import { NewTicketForm } from "./form";

export const metadata = { title: "New query" };

export default function NewTicket() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ask a question" subtitle="Give enough detail so we can help in one reply: course code, dates, what you've tried." />
      <Card className="p-4 sm:p-6">
        <NewTicketForm />
      </Card>
    </div>
  );
}
