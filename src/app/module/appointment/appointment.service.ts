import status from "http-status";
import { v4 as uuidv4 } from "uuid";
import { Appointment, Prisma } from "../../../generated/prisma/client";
import { AppointmentStatus, NotificationType, PaymentStatus, Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationService } from "../notification/notification.service";
import {
    appointmentFilterableFields,
    appointmentIncludeConfig,
    appointmentSearchableFields,
} from "./appointment.constant";
import { IBookAppointmentPayload, IUpdateAppointmentStatusPayload } from "./appointment.interface";

const createAppointment = async (payload: IBookAppointmentPayload, user: IRequestUser) => {
    // 1. Resolve & validate authenticated patient
    const patient = await prisma.patient.findFirst({
        where: {
            userId: user.userId,
            isDeleted: false,
        },
        include: {
            user: true,
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient profile not found");
    }

    if (patient.user.status === UserStatus.BLOCKED || patient.user.isDeleted || patient.user.status === UserStatus.DELETED) {
        throw new AppError(status.FORBIDDEN, "Your patient account is not active");
    }

    // 2. Resolve & validate doctor
    const doctor = await prisma.doctor.findFirst({
        where: {
            id: payload.doctorId,
            isDeleted: false,
        },
        include: {
            user: true,
        },
    });

    if (!doctor) {
        throw new AppError(status.NOT_FOUND, "Doctor not found or is inactive");
    }

    if (doctor.user.status === UserStatus.BLOCKED || doctor.user.isDeleted || doctor.user.status === UserStatus.DELETED) {
        throw new AppError(status.FORBIDDEN, "Doctor is currently inactive");
    }

    // 3. Resolve & validate schedule
    const schedule = await prisma.schedule.findUnique({
        where: {
            id: payload.scheduleId,
        },
    });

    if (!schedule) {
        throw new AppError(status.NOT_FOUND, "Schedule not found");
    }

    if (new Date(schedule.startDateTime) <= new Date()) {
        throw new AppError(status.BAD_REQUEST, "Cannot book a schedule that is in the past");
    }

    // 4. Validate DoctorSchedule relation & availability
    const doctorSchedule = await prisma.doctorSchedules.findUnique({
        where: {
            doctorId_scheduleId: {
                doctorId: payload.doctorId,
                scheduleId: payload.scheduleId,
            },
        },
    });

    if (!doctorSchedule) {
        throw new AppError(status.NOT_FOUND, "Doctor is not assigned to this schedule");
    }

    if (doctorSchedule.isBooked) {
        throw new AppError(status.CONFLICT, "Doctor schedule is already booked");
    }

    // 5. Conflict protection: check for existing active appointment
    const existingActiveAppointment = await prisma.appointment.findFirst({
        where: {
            doctorId: payload.doctorId,
            scheduleId: payload.scheduleId,
            status: {
                in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS],
            },
        },
    });

    if (existingActiveAppointment) {
        throw new AppError(status.CONFLICT, "Doctor schedule is already booked");
    }

    const patientScheduleConflict = await prisma.appointment.findFirst({
        where: {
            patientId: patient.id,
            scheduleId: payload.scheduleId,
            status: {
                in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS],
            },
        },
    });

    if (patientScheduleConflict) {
        throw new AppError(status.CONFLICT, "You already have an active appointment booked for this time slot");
    }

    // 6. Transactional creation with atomic isBooked guard
    const videoCallingId = uuidv4();

    const appointment = await prisma.$transaction(async (tx) => {
        // Atomic conditional update to prevent race conditions
        const updateResult = await tx.doctorSchedules.updateMany({
            where: {
                doctorId: payload.doctorId,
                scheduleId: payload.scheduleId,
                isBooked: false,
            },
            data: {
                isBooked: true,
            },
        });

        if (updateResult.count === 0) {
            throw new AppError(status.CONFLICT, "Doctor schedule slot was just booked by another user");
        }

        const newAppointment = await tx.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: payload.doctorId,
                scheduleId: payload.scheduleId,
                videoCallingId,
                status: AppointmentStatus.SCHEDULED,
                paymentStatus: PaymentStatus.UNPAID,
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePhoto: true,
                        designation: true,
                        qualification: true,
                        appointmentFee: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePhoto: true,
                        contactNumber: true,
                    },
                },
                schedule: true,
            },
        });

        // Notify doctor about new booking
        await NotificationService.createNotification(
            {
                recipientId: doctor.userId,
                type: NotificationType.APPOINTMENT_BOOKED,
                title: "New Appointment Booked",
                message: `Patient ${patient.name} booked an appointment for ${new Date(schedule.startDateTime).toUTCString()}.`,
                data: {
                    appointmentId: newAppointment.id,
                    patientId: patient.id,
                    doctorId: payload.doctorId,
                    scheduleId: payload.scheduleId,
                },
            },
            tx
        );

        return newAppointment;
    });

    return appointment;
};

const getMyAppointments = async (user: IRequestUser, query: IQueryParams) => {
    let whereFilter: Prisma.AppointmentWhereInput = {};

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
        whereFilter = { patientId: patient.id };
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
        whereFilter = { doctorId: doctor.id };
    } else if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
        whereFilter = {};
    } else {
        throw new AppError(status.FORBIDDEN, "Forbidden access");
    }

    const queryBuilder = new QueryBuilder<Appointment, Prisma.AppointmentWhereInput, Prisma.AppointmentInclude>(
        prisma.appointment,
        query,
        {
            searchableFields: appointmentSearchableFields,
            filterableFields: appointmentFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where(whereFilter)
        .paginate()
        .include({
            doctor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    designation: true,
                    qualification: true,
                    appointmentFee: true,
                },
            },
            patient: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                },
            },
            schedule: true,
            prescription: true,
            review: true,
        })
        .dynamicInclude(appointmentIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getAppointmentById = async (id: string, user: IRequestUser) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
            doctor: {
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    designation: true,
                    qualification: true,
                    appointmentFee: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            role: true,
                            status: true,
                        },
                    },
                },
            },
            patient: {
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            role: true,
                            status: true,
                        },
                    },
                },
            },
            schedule: true,
            prescription: true,
            review: true,
            payment: true,
        },
    });

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    // Role-based ownership verification
    if (user.role === Role.PATIENT && appointment.patient.userId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot view another patient's appointment");
    }

    if (user.role === Role.DOCTOR && appointment.doctor.userId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot view another doctor's appointment");
    }

    return appointment;
};

const changeAppointmentStatus = async (
    id: string,
    payload: IUpdateAppointmentStatusPayload,
    user: IRequestUser
) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
            doctor: true,
            patient: true,
            schedule: true,
        },
    });

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    const { status: newStatus } = payload;
    const currentStatus = appointment.status;

    // 1. Role-based ownership check
    if (user.role === Role.PATIENT) {
        if (appointment.patient.userId !== user.userId) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot modify another patient's appointment");
        }
        if (newStatus !== AppointmentStatus.CANCELED) {
            throw new AppError(status.FORBIDDEN, "Patients can only cancel their scheduled appointments");
        }
    }

    if (user.role === Role.DOCTOR) {
        if (appointment.doctor.userId !== user.userId) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot modify another doctor's appointment");
        }
    }

    // 2. Terminal state validation: completed or cancelled appointments cannot change
    if (currentStatus === AppointmentStatus.COMPLETED || currentStatus === AppointmentStatus.CANCELED) {
        throw new AppError(
            status.BAD_REQUEST,
            `Cannot update status of an appointment that is already ${currentStatus.toLowerCase()}`
        );
    }

    // 3. Valid state transitions
    if (currentStatus === AppointmentStatus.SCHEDULED) {
        if (newStatus !== AppointmentStatus.INPROGRESS && newStatus !== AppointmentStatus.CANCELED) {
            throw new AppError(
                status.BAD_REQUEST,
                `Invalid transition from SCHEDULED to ${newStatus}. Allowed: INPROGRESS, CANCELED`
            );
        }
    } else if (currentStatus === AppointmentStatus.INPROGRESS) {
        if (newStatus !== AppointmentStatus.COMPLETED && newStatus !== AppointmentStatus.CANCELED) {
            throw new AppError(
                status.BAD_REQUEST,
                `Invalid transition from INPROGRESS to ${newStatus}. Allowed: COMPLETED, CANCELED`
            );
        }
    }

    // 4. Execute update in transaction (and reopen schedule slot if cancelling)
    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.appointment.update({
            where: { id },
            data: {
                status: newStatus,
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePhoto: true,
                        designation: true,
                        qualification: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profilePhoto: true,
                        contactNumber: true,
                    },
                },
                schedule: true,
            },
        });

        if (newStatus === AppointmentStatus.CANCELED) {
            // Reopen doctor schedule slot only if no other active appointment occupies it
            const otherActiveAppointment = await tx.appointment.findFirst({
                where: {
                    id: { not: id },
                    doctorId: appointment.doctorId,
                    scheduleId: appointment.scheduleId,
                    status: {
                        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS],
                    },
                },
            });

            if (!otherActiveAppointment) {
                await tx.doctorSchedules.updateMany({
                    where: {
                        doctorId: appointment.doctorId,
                        scheduleId: appointment.scheduleId,
                    },
                    data: {
                        isBooked: false,
                    },
                });
            }
        }

        // Send role-aware notifications on status changes
        if (newStatus === AppointmentStatus.INPROGRESS) {
            await NotificationService.createNotification(
                {
                    recipientId: appointment.patient.userId,
                    type: NotificationType.APPOINTMENT_INPROGRESS,
                    title: "Appointment In Progress",
                    message: `Your appointment with Dr. ${appointment.doctor.name} is now in progress.`,
                    data: {
                        appointmentId: id,
                        doctorId: appointment.doctorId,
                        patientId: appointment.patientId,
                    },
                },
                tx
            );
        } else if (newStatus === AppointmentStatus.COMPLETED) {
            await NotificationService.createNotification(
                {
                    recipientId: appointment.patient.userId,
                    type: NotificationType.APPOINTMENT_COMPLETED,
                    title: "Appointment Completed",
                    message: `Your appointment with Dr. ${appointment.doctor.name} has been completed.`,
                    data: {
                        appointmentId: id,
                        doctorId: appointment.doctorId,
                        patientId: appointment.patientId,
                    },
                },
                tx
            );
        } else if (newStatus === AppointmentStatus.CANCELED) {
            const recipientId = user.role === Role.PATIENT ? appointment.doctor.userId : appointment.patient.userId;
            const cancelMessage = user.role === Role.PATIENT
                ? `Patient ${appointment.patient.name} has canceled their appointment scheduled for ${new Date(appointment.schedule.startDateTime).toUTCString()}.`
                : `Your appointment with Dr. ${appointment.doctor.name} scheduled for ${new Date(appointment.schedule.startDateTime).toUTCString()} has been canceled.`;

            await NotificationService.createNotification(
                {
                    recipientId,
                    type: NotificationType.APPOINTMENT_CANCELED,
                    title: "Appointment Canceled",
                    message: cancelMessage,
                    data: {
                        appointmentId: id,
                        doctorId: appointment.doctorId,
                        patientId: appointment.patientId,
                        scheduleId: appointment.scheduleId,
                    },
                },
                tx
            );
        }

        return updated;
    });

    return result;
};

const cancelAppointment = async (id: string, user: IRequestUser) => {
    return await changeAppointmentStatus(id, { status: AppointmentStatus.CANCELED }, user);
};

const getAllAppointments = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Appointment, Prisma.AppointmentWhereInput, Prisma.AppointmentInclude>(
        prisma.appointment,
        query,
        {
            searchableFields: appointmentSearchableFields,
            filterableFields: appointmentFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .paginate()
        .include({
            doctor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    designation: true,
                    qualification: true,
                    appointmentFee: true,
                },
            },
            patient: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                },
            },
            schedule: true,
        })
        .dynamicInclude(appointmentIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const cancelUnpaidAppointments = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const unpaidAppointments = await prisma.appointment.findMany({
        where: {
            status: AppointmentStatus.SCHEDULED,
            paymentStatus: PaymentStatus.UNPAID,
            createdAt: {
                lte: thirtyMinutesAgo,
            },
        },
    });

    if (unpaidAppointments.length === 0) {
        return;
    }

    const appointmentIdsToCancel = unpaidAppointments.map((app) => app.id);

    await prisma.$transaction(async (tx) => {
        await tx.appointment.updateMany({
            where: {
                id: { in: appointmentIdsToCancel },
            },
            data: {
                status: AppointmentStatus.CANCELED,
            },
        });

        for (const unpaidApp of unpaidAppointments) {
            const otherActive = await tx.appointment.findFirst({
                where: {
                    id: { notIn: appointmentIdsToCancel },
                    doctorId: unpaidApp.doctorId,
                    scheduleId: unpaidApp.scheduleId,
                    status: {
                        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS],
                    },
                },
            });

            if (!otherActive) {
                await tx.doctorSchedules.updateMany({
                    where: {
                        doctorId: unpaidApp.doctorId,
                        scheduleId: unpaidApp.scheduleId,
                    },
                    data: {
                        isBooked: false,
                    },
                });
            }
        }
    });
};

export const AppointmentService = {
    createAppointment,
    getMyAppointments,
    getAppointmentById,
    changeAppointmentStatus,
    cancelAppointment,
    getAllAppointments,
    cancelUnpaidAppointments,
};