/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { Payment, Prisma } from "../../../generated/prisma/client";
import { AppointmentStatus, NotificationType, PaymentStatus, Role } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationService } from "../notification/notification.service";
import { paymentFilterableFields, paymentIncludeConfig, paymentSearchableFields } from "./payment.constant";
import { ICreateCheckoutSessionPayload } from "./payment.interface";

const createCheckoutSession = async (payload: ICreateCheckoutSessionPayload, user: IRequestUser) => {
    // 1. Resolve patient
    const patient = await prisma.patient.findFirst({
        where: {
            userId: user.userId,
            isDeleted: false,
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient profile not found");
    }

    // 2. Resolve appointment with doctor and schedule
    const appointment = await prisma.appointment.findUnique({
        where: {
            id: payload.appointmentId,
        },
        include: {
            doctor: true,
            schedule: true,
            payment: true,
        },
    });

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    // 3. Verify ownership
    if (appointment.patientId !== patient.id) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to pay for this appointment");
    }

    // 4. Verify payment eligibility
    if (appointment.paymentStatus === PaymentStatus.PAID) {
        throw new AppError(status.BAD_REQUEST, "This appointment has already been paid for");
    }

    if (appointment.status === AppointmentStatus.CANCELED) {
        throw new AppError(status.BAD_REQUEST, "Cannot initiate payment for a canceled appointment");
    }

    const feeAmount = appointment.doctor.appointmentFee;
    if (!feeAmount || feeAmount <= 0) {
        throw new AppError(status.BAD_REQUEST, "Invalid doctor appointment fee");
    }

    // 5. Ensure Payment record exists or create one
    let payment = appointment.payment;

    if (!payment) {
        payment = await prisma.payment.create({
            data: {
                appointmentId: appointment.id,
                amount: feeAmount,
                transactionId: uuidv4(),
                status: PaymentStatus.UNPAID,
            },
        });
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `Doctor Appointment - Dr. ${appointment.doctor.name}`,
                        description: `Consultation schedule: ${new Date(appointment.schedule.startDateTime).toUTCString()}`,
                    },
                    unit_amount: Math.round(feeAmount * 100), // Stripe accepts cents
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: `${envVars.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&appointmentId=${appointment.id}`,
        cancel_url: `${envVars.FRONTEND_URL}/payment/cancel?appointmentId=${appointment.id}`,
        metadata: {
            appointmentId: appointment.id,
            paymentId: payment.id,
            patientId: patient.id,
            doctorId: appointment.doctorId,
        },
    });

    return {
        paymentUrl: session.url,
        sessionId: session.id,
    };
};

const getMyPayments = async (user: IRequestUser, query: IQueryParams) => {
    let whereFilter: Prisma.PaymentWhereInput = {};

    if (user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!patient) {
            throw new AppError(status.NOT_FOUND, "Patient profile not found");
        }

        whereFilter = {
            appointment: {
                patientId: patient.id,
            },
        };
    } else if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor profile not found");
        }

        whereFilter = {
            appointment: {
                doctorId: doctor.id,
            },
        };
    } else if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
        whereFilter = {};
    } else {
        throw new AppError(status.FORBIDDEN, "Forbidden access");
    }

    const queryBuilder = new QueryBuilder<Payment, Prisma.PaymentWhereInput, Prisma.PaymentInclude>(
        prisma.payment,
        query,
        {
            searchableFields: paymentSearchableFields,
            filterableFields: paymentFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where(whereFilter)
        .paginate()
        .dynamicInclude(paymentIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const handlerStripeWebhookEvent = async (event: Stripe.Event) => {
    const existingPayment = await prisma.payment.findFirst({
        where: {
            stripeEventId: event.id,
        },
    });

    if (existingPayment) {
        return { message: `Event ${event.id} already processed. Skipping.` };
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;

            const appointmentId = session.metadata?.appointmentId;
            const paymentId = session.metadata?.paymentId;

            if (!appointmentId || !paymentId) {
                return { message: "Missing appointmentId or paymentId in session metadata" };
            }

            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                include: { doctor: true, patient: true, schedule: true },
            });

            if (!appointment) {
                return { message: `Appointment with id ${appointmentId} not found` };
            }

            const isPaid = session.payment_status === "paid";

            if (isPaid && appointment.status === AppointmentStatus.CANCELED) {
                // Race condition: Appointment was cancelled before payment arrived
                // Check if the doctor's schedule slot is still unbooked
                const doctorSchedule = await prisma.doctorSchedules.findUnique({
                    where: {
                        doctorId_scheduleId: {
                            doctorId: appointment.doctorId,
                            scheduleId: appointment.scheduleId,
                        },
                    },
                });

                if (doctorSchedule && !doctorSchedule.isBooked) {
                    // Reactivate appointment
                    await prisma.$transaction(async (tx) => {
                        await tx.doctorSchedules.update({
                            where: {
                                doctorId_scheduleId: {
                                    doctorId: appointment.doctorId,
                                    scheduleId: appointment.scheduleId,
                                },
                            },
                            data: { isBooked: true },
                        });

                        await tx.appointment.update({
                            where: { id: appointmentId },
                            data: {
                                status: AppointmentStatus.SCHEDULED,
                                paymentStatus: PaymentStatus.PAID,
                            },
                        });

                        await tx.payment.update({
                            where: { id: paymentId },
                            data: {
                                stripeEventId: event.id,
                                status: PaymentStatus.PAID,
                                paymentGatewayData: session as any,
                            },
                        });

                        // Notify patient & doctor
                        await NotificationService.createNotification(
                            {
                                recipientId: appointment.patient.userId,
                                type: NotificationType.PAYMENT_SUCCESS,
                                title: "Payment Successful",
                                message: `Your payment of $${appointment.doctor.appointmentFee} for appointment with Dr. ${appointment.doctor.name} was successful.`,
                                data: {
                                    paymentId,
                                    appointmentId,
                                    amount: appointment.doctor.appointmentFee,
                                    eventId: event.id,
                                },
                            },
                            tx
                        );

                        await NotificationService.createNotification(
                            {
                                recipientId: appointment.doctor.userId,
                                type: NotificationType.PAYMENT_SUCCESS,
                                title: "Appointment Payment Received",
                                message: `Payment received for appointment with patient ${appointment.patient.name}.`,
                                data: {
                                    paymentId,
                                    appointmentId,
                                    amount: appointment.doctor.appointmentFee,
                                    eventId: event.id,
                                },
                            },
                            tx
                        );
                    });
                } else {
                    // Slot is already taken or unavailable: issue full automatic Stripe refund
                    if (session.payment_intent) {
                        await stripe.refunds.create({
                            payment_intent: session.payment_intent as string,
                            reason: "requested_by_customer",
                        });
                    }

                    await prisma.payment.update({
                        where: { id: paymentId },
                        data: {
                            stripeEventId: event.id,
                            status: PaymentStatus.UNPAID,
                            paymentGatewayData: {
                                ...((session as any) || {}),
                                refundStatus: "AUTO_REFUNDED_DUE_TO_SLOT_UNAVAILABLE",
                            },
                        },
                    });

                    // Notify patient about refund
                    await NotificationService.createNotification({
                        recipientId: appointment.patient.userId,
                        type: NotificationType.PAYMENT_REFUNDED,
                        title: "Payment Refunded",
                        message: `Your payment of $${appointment.doctor.appointmentFee} for appointment with Dr. ${appointment.doctor.name} was refunded because the slot was no longer available.`,
                        data: {
                            paymentId,
                            appointmentId,
                            amount: appointment.doctor.appointmentFee,
                            eventId: event.id,
                        },
                    });
                }
            } else {
                // Standard payment update
                await prisma.$transaction(async (tx) => {
                    await tx.appointment.update({
                        where: { id: appointmentId },
                        data: {
                            paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                        },
                    });

                    await tx.payment.update({
                        where: { id: paymentId },
                        data: {
                            stripeEventId: event.id,
                            status: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                            paymentGatewayData: session as any,
                        },
                    });

                    if (isPaid) {
                        // Notify patient
                        await NotificationService.createNotification(
                            {
                                recipientId: appointment.patient.userId,
                                type: NotificationType.PAYMENT_SUCCESS,
                                title: "Payment Successful",
                                message: `Your payment of $${appointment.doctor.appointmentFee} for appointment with Dr. ${appointment.doctor.name} was successful.`,
                                data: {
                                    paymentId,
                                    appointmentId,
                                    amount: appointment.doctor.appointmentFee,
                                    eventId: event.id,
                                },
                            },
                            tx
                        );

                        // Notify doctor
                        await NotificationService.createNotification(
                            {
                                recipientId: appointment.doctor.userId,
                                type: NotificationType.PAYMENT_SUCCESS,
                                title: "Appointment Payment Received",
                                message: `Payment received for appointment with patient ${appointment.patient.name}.`,
                                data: {
                                    paymentId,
                                    appointmentId,
                                    amount: appointment.doctor.appointmentFee,
                                    eventId: event.id,
                                },
                            },
                            tx
                        );
                    }
                });
            }
            break;
        }

        case "checkout.session.expired":
        case "payment_intent.payment_failed": {
            break;
        }

        default:
            break;
    }

    return { message: `Webhook event ${event.id} processed successfully` };
};

const verifyPaymentSession = async (sessionId: string, user: IRequestUser) => {
    let session: Stripe.Checkout.Session;
    try {
        session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["payment_intent"],
        });
    } catch (error: any) {
        throw new AppError(status.BAD_REQUEST, `Invalid Stripe checkout session: ${error.message}`);
    }

    const appointmentId = session.metadata?.appointmentId;
    const paymentId = session.metadata?.paymentId;

    if (!appointmentId) {
        throw new AppError(status.BAD_REQUEST, "Appointment metadata missing in checkout session");
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            doctor: true,
            patient: true,
            schedule: true,
            payment: true,
        },
    });

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    if (user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
            where: { userId: user.userId, isDeleted: false },
        });
        if (!patient || appointment.patientId !== patient.id) {
            throw new AppError(status.FORBIDDEN, "Unauthorized access to this appointment payment");
        }
    }

    const isPaid = session.payment_status === "paid";

    if (isPaid && appointment.paymentStatus !== PaymentStatus.PAID) {
        await prisma.$transaction(async (tx) => {
            await tx.appointment.update({
                where: { id: appointmentId },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                },
            });

            if (paymentId) {
                await tx.payment.update({
                    where: { id: paymentId },
                    data: {
                        stripeEventId: session.id,
                        status: PaymentStatus.PAID,
                        paymentGatewayData: session as any,
                    },
                });
            } else {
                await tx.payment.upsert({
                    where: { appointmentId },
                    create: {
                        appointmentId,
                        amount: appointment.doctor.appointmentFee,
                        transactionId: uuidv4(),
                        stripeEventId: session.id,
                        status: PaymentStatus.PAID,
                        paymentGatewayData: session as any,
                    },
                    update: {
                        stripeEventId: session.id,
                        status: PaymentStatus.PAID,
                        paymentGatewayData: session as any,
                    },
                });
            }

            await NotificationService.createNotification(
                {
                    recipientId: appointment.patient.userId,
                    type: NotificationType.PAYMENT_SUCCESS,
                    title: "Payment Successful",
                    message: `Your payment of $${appointment.doctor.appointmentFee} for appointment with Dr. ${appointment.doctor.name} was confirmed.`,
                    data: {
                        appointmentId,
                        amount: appointment.doctor.appointmentFee,
                        sessionId: session.id,
                    },
                },
                tx
            );

            await NotificationService.createNotification(
                {
                    recipientId: appointment.doctor.userId,
                    type: NotificationType.PAYMENT_SUCCESS,
                    title: "Appointment Payment Received",
                    message: `Payment received for appointment with patient ${appointment.patient.name}.`,
                    data: {
                        appointmentId,
                        amount: appointment.doctor.appointmentFee,
                        sessionId: session.id,
                    },
                },
                tx
            );
        });
    }

    const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            doctor: true,
            patient: true,
            schedule: true,
            payment: true,
        },
    });

    return {
        isPaid: updatedAppointment?.paymentStatus === PaymentStatus.PAID,
        appointment: updatedAppointment,
        payment: updatedAppointment?.payment,
    };
};

const getPaymentInvoice = async (paymentIdOrAppointmentId: string, user: IRequestUser) => {
    const payment = await prisma.payment.findFirst({
        where: {
            OR: [
                { id: paymentIdOrAppointmentId },
                { appointmentId: paymentIdOrAppointmentId },
            ],
        },
        include: {
            appointment: {
                include: {
                    doctor: true,
                    patient: true,
                    schedule: true,
                },
            },
        },
    });

    if (!payment) {
        throw new AppError(status.NOT_FOUND, "Payment record not found");
    }

    const appointment = payment.appointment;

    if (user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
            where: { userId: user.userId, isDeleted: false },
        });
        if (!patient || appointment.patientId !== patient.id) {
            throw new AppError(status.FORBIDDEN, "Unauthorized access to this invoice");
        }
    } else if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: { userId: user.userId, isDeleted: false },
        });
        if (!doctor || appointment.doctorId !== doctor.id) {
            throw new AppError(status.FORBIDDEN, "Unauthorized access to this invoice");
        }
    }

    if (payment.status !== PaymentStatus.PAID && appointment.paymentStatus !== PaymentStatus.PAID) {
        throw new AppError(status.BAD_REQUEST, "Invoice is only available for paid appointments");
    }

    const invoiceNumber = `DOC-INV-${payment.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = payment.updatedAt || payment.createdAt;
    const formattedDate = new Date(invoiceDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const appointmentSchedule = appointment.schedule?.startDateTime
        ? new Date(appointment.schedule.startDateTime).toLocaleString("en-US", {
              dateStyle: "full",
              timeStyle: "short",
          })
        : "N/A";

    return {
        invoiceNumber,
        transactionId: payment.transactionId,
        paymentId: payment.id,
        appointmentId: appointment.id,
        paymentStatus: payment.status,
        amount: payment.amount,
        currency: "BDT",
        paymentDate: formattedDate,
        patient: {
            id: appointment.patient.id,
            name: appointment.patient.name,
            email: appointment.patient.email,
        },
        doctor: {
            id: appointment.doctor.id,
            name: appointment.doctor.name,
            designation: appointment.doctor.designation,
            hospital: appointment.doctor.currentWorkingPlace || "Doctorly Telemedicine",
        },
        schedule: {
            appointmentTime: appointmentSchedule,
        },
    };
};

export const PaymentService = {
    createCheckoutSession,
    getMyPayments,
    handlerStripeWebhookEvent,
    verifyPaymentSession,
    getPaymentInvoice,
};