import { LifeBuoy } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { getPublishedFaqs, orderedCategories } from "@/lib/faqs";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { FaqBrowser } from "@/components/faq-browser";

export const metadata = { title: "FAQs" };

export default async function Faqs() {
  await requireStudent();
  const faqs = await getPublishedFaqs();
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        subtitle="Answers based on IGNOU's official FAQs and prospectus. Fees and dates can change — always check the latest notice on ignou.ac.in."
      />
      <FaqBrowser faqs={faqs} categories={orderedCategories(faqs.map((f) => f.category))} />
      <Card className="mt-8 flex flex-wrap items-center gap-4 p-5">
        <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><LifeBuoy className="size-5" aria-hidden /></div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Didn&apos;t find your answer?</p>
          <p className="text-sm text-muted">Ask the study centre — the coordinator will reply here.</p>
        </div>
        <LinkButton href="/tickets/new">Raise a query</LinkButton>
      </Card>
    </>
  );
}
