import { Prisma } from "../../../generated/prisma/client";

export const medicalRecordSearchableFields = [
    "diagnosis",
    "symptoms",
    "clinicalNotes",
    "treatment",
    "advice",
    "patient.name",
    "patient.email",
    "doctor.name",
    "doctor.email",
];

export const medicalRecordFilterableFields = [
    "patientId",
    "doctorId",
    "appointmentId",
    "isDeleted",
    "createdAt",
    "updatedAt",
    "followUpDate",
];

export const medicalRecordIncludeConfig: Partial<Record<keyof Prisma.MedicalRecordInclude, Prisma.MedicalRecordInclude[keyof Prisma.MedicalRecordInclude]>> = {
    patient: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            contactNumber: true,
            address: true,
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
    doctor: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            designation: true,
            qualification: true,
            currentWorkingPlace: true,
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
    appointment: {
        select: {
            id: true,
            videoCallingId: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            updatedAt: true,
            schedule: true,
        },
    },
    prescription: true,
};
