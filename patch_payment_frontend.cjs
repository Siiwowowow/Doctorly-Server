/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const feDir = path.resolve('..', 'Doctorly-Fontend');

console.log('Checking frontend directory:', feDir);
if (!fs.existsSync(feDir)) {
    console.error('Doctorly-Fontend directory not found!');
    process.exit(1);
}

// 1. Update InvoiceDownloadButton.tsx
const invoiceBtnPath = path.join(feDir, 'src', 'components', 'shared', 'InvoiceDownloadButton.tsx');
const invoiceBtnCode = `"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface InvoiceDownloadButtonProps {
  paymentId: string;
  className?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  disabled?: boolean;
}

export function InvoiceDownloadButton({
  paymentId,
  className = "",
  variant = "outline",
  size = "icon",
  children,
  disabled = false,
}: InvoiceDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (disabled || !paymentId) return;
    setLoading(true);
    try {
      const response = await fetch(\`\${BASE_API_URL}/payments/invoice/\${paymentId}?format=pdf&download=true\`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/pdf",
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || \`Failed to download invoice (HTTP \${response.status})\`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = \`Doctorly-Invoice-\${paymentId.slice(0, 8)}.pdf\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Invoice downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled || loading}
      className={className}
      title="Download Official Invoice"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : children ? (
        children
      ) : (
        <Download className="size-4 text-doctorly-primary" />
      )}
    </Button>
  );
}
`;
fs.writeFileSync(invoiceBtnPath, invoiceBtnCode, 'utf-8');
console.log('Updated InvoiceDownloadButton.tsx');

// 2. Update user/appointments/page.tsx
const userAptPath = path.join(feDir, 'src', 'app', '(dashboardLayout)', 'user', 'appointments', 'page.tsx');
let userAptCode = fs.readFileSync(userAptPath, 'utf-8');
userAptCode = userAptCode.replace(
  /\{apt\.paymentStatus === PaymentStatus\.PAID && apt\.payment\?\.id && \(\s*<InvoiceDownloadButton paymentId=\{apt\.payment\.id\}/g,
  `{apt.paymentStatus === PaymentStatus.PAID && (
                        <InvoiceDownloadButton paymentId={apt.payment?.id || apt.id}`
);
fs.writeFileSync(userAptPath, userAptCode, 'utf-8');
console.log('Updated user/appointments/page.tsx');

// 3. Update payment/cancel/page.tsx
const cancelPagePath = path.join(feDir, 'src', 'app', 'payment', 'cancel', 'page.tsx');
const cancelPageCode = `"use client";

import Link from "next/link";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createCheckoutSession } from "@/services/payment.services";
import { toast } from "sonner";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const [retrying, setRetrying] = useState(false);

  const handleRetryPayment = async () => {
    if (!appointmentId) return;
    setRetrying(true);
    try {
      const res = await createCheckoutSession(appointmentId);
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error("Could not create new checkout session. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to retry payment");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-red-500/5 border p-10 text-center animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
      <div className="mx-auto w-24 h-24 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
        <XCircle size={48} className="relative z-10" strokeWidth={2.5} />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Payment Cancelled</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
        Your payment process was interrupted or cancelled. Don&apos;t worry, no charges were made to your account.
      </p>

      {appointmentId && (
        <div className="bg-muted/40 rounded-2xl p-4 mb-6 border text-left">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Appointment Ref</span>
          <code className="text-doctorly-primary font-mono font-semibold text-sm">{appointmentId}</code>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {appointmentId && (
          <Button
            onClick={handleRetryPayment}
            disabled={retrying}
            size="lg"
            className="w-full rounded-xl h-12 text-base font-semibold bg-doctorly-primary hover:bg-doctorly-primary/90 text-white shadow-md hover:shadow-lg transition-all"
          >
            {retrying ? (
              <RefreshCw className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Retry Payment Now
          </Button>
        )}
        <Button asChild variant="outline" size="lg" className="w-full rounded-xl h-12 text-base font-medium">
          <Link href="/user/appointments">
            <ArrowLeft className="mr-2 size-4" /> View My Appointments
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full rounded-xl h-11 text-sm font-medium">
          <Link href="/user/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <PaymentCancelContent />
      </Suspense>
    </div>
  );
}
`;
fs.writeFileSync(cancelPagePath, cancelPageCode, 'utf-8');
console.log('Updated payment/cancel/page.tsx');

console.log('All frontend payment updates applied successfully!');
