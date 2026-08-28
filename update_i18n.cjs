const fs = require('fs');
const path = require('path');

const feDir = path.resolve('..', 'Doctorly-Fontend');
const enPath = path.join(feDir, 'messages', 'en.json');
const bnPath = path.join(feDir, 'messages', 'bn.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const bn = JSON.parse(fs.readFileSync(bnPath, 'utf-8'));

en.payments = {
    title: "Payments & Invoices",
    subtitle: "View your transaction history and download official consultation receipts.",
    payNow: "Pay Now",
    processing: "Processing payment...",
    verifying: "Verifying your payment with Stripe...",
    verifyingDetails: "Confirming transaction details. Please wait a moment...",
    verificationInProgress: "Payment Verification in Progress",
    verificationDescription: "Your transaction was received and is currently being synchronized with our healthcare system.",
    checkStatusAgain: "Check Status Again",
    paymentSuccessful: "Payment Successful!",
    paymentConfirmed: "Your payment has been confirmed and your consultation is booked.",
    paymentCancelled: "Payment Cancelled",
    cancelDescription: "Your payment process was interrupted or cancelled. No charges were made to your account.",
    retryPayment: "Retry Payment Now",
    downloadInvoice: "Download Official Invoice",
    downloadingInvoice: "Generating invoice...",
    invoiceSuccess: "Invoice downloaded successfully!",
    invoiceError: "Failed to download invoice. Please try again.",
    alreadyPaid: "This appointment has already been paid.",
    appointmentRef: "Appointment Reference",
    transactionId: "Transaction ID",
    amount: "Amount",
    date: "Date",
    status: "Status"
};

bn.payments = {
    title: "পেমেন্ট ও ইনভয়েস",
    subtitle: "আপনার লেনদেনের ইতিহাস দেখুন এবং অফিশিয়াল পরামর্শ রসিদ ডাউনলোড করুন।",
    payNow: "এখনই পরিশোধ করুন",
    processing: "পেমেন্ট প্রক্রিয়াকরণ হচ্ছে...",
    verifying: "স্ট্রাইপের সাথে আপনার পেমেন্ট যাচাই করা হচ্ছে...",
    verifyingDetails: "লেনদেনের বিবরণ নিশ্চিত করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...",
    verificationInProgress: "পেমেন্ট যাচাইকরণ চলমান",
    verificationDescription: "আপনার লেনদেন গৃহীত হয়েছে এবং বর্তমানে আমাদের স্বাস্থ্যসেবা সিস্টেমে সিঙ্ক করা হচ্ছে।",
    checkStatusAgain: "আবার স্ট্যাটাস পরীক্ষা করুন",
    paymentSuccessful: "পেমেন্ট সফল হয়েছে!",
    paymentConfirmed: "আপনার পেমেন্ট নিশ্চিত হয়েছে এবং আপনার পরামর্শ বুক করা হয়েছে।",
    paymentCancelled: "পেমেন্ট বাতিল হয়েছে",
    cancelDescription: "আপনার পেমেন্ট প্রক্রিয়া ব্যাহত বা বাতিল হয়েছে। আপনার অ্যাকাউন্ট থেকে কোনো টাকা কাটা হয়নি।",
    retryPayment: "আবার পেমেন্ট চেষ্টা করুন",
    downloadInvoice: "অফিশিয়াল ইনভয়েস ডাউনলোড করুন",
    downloadingInvoice: "ইনভয়েস তৈরি করা হচ্ছে...",
    invoiceSuccess: "ইনভয়েস সফলভাবে ডাউনলোড হয়েছে!",
    invoiceError: "ইনভয়েস ডাউনলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    alreadyPaid: "এই অ্যাপয়েন্টমেন্টের ফি ইতিমধ্যে পরিশোধ করা হয়েছে।",
    appointmentRef: "অ্যাপয়েন্টমেন্ট রেফারেন্স",
    transactionId: "ট্রানজাকশন আইডি",
    amount: "পরিমাণ",
    date: "তারিখ",
    status: "স্ট্যাটাস"
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf-8');
fs.writeFileSync(bnPath, JSON.stringify(bn, null, 2), 'utf-8');

console.log('Successfully updated i18n messages for en.json and bn.json');
