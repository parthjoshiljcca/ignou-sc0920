import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { qrSvg, receiptById, siteOrigin } from "@/lib/assignment-data";
import { AssignmentReceipt } from "@/components/assignment-receipt";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Assignment receipt" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const data = await receiptById(id);
  // Students can only open their own receipt; the coordinator can open any.
  if (!data || (u.role !== "admin" && data.receipt.enrollmentNo !== u.enrollmentNo)) notFound();
  const verifyUrl = `${await siteOrigin()}/verify/${data.receipt.verifyCode}`;
  const back = u.role === "admin" ? `/admin/assignments?q=${data.receipt.enrollmentNo}` : "/assignments";

  return (
    <div className="min-h-dvh bg-bg px-3 py-4 sm:px-6 sm:py-8">
      <div className="no-print mx-auto mb-4 flex max-w-[780px] flex-wrap items-center justify-between gap-3">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Link>
        <PrintButton />
      </div>
      <AssignmentReceipt data={data} verifyUrl={verifyUrl} qr={await qrSvg(verifyUrl)} />
      <p className="no-print mx-auto mt-3 max-w-[780px] text-center text-xs text-muted">Tip: in the print dialog choose “Save as PDF” to keep a copy on your phone.</p>
    </div>
  );
}
