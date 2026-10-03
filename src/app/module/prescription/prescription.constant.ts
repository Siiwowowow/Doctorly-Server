import { Prisma } from "../../../generated/prisma/client";

export const prescriptionSearchableFields = [
    "instructions",
    "notes",
    "advice",
    "id",
    "patientId",
    "appointmentId",
    "patient.contactNumber",
    "patient.name",
    "patient.email",
    "doctor.name",
    "doctor.email",
    "medicines.medicineName",
];

export const prescriptionFilterableFields = [
    "patientId",
    "doctorId",
    "appointmentId",
    "medicalRecordId",
    "isDeleted",
    "createdAt",
    "updatedAt",
    "followUpDate",
];

export const prescriptionIncludeConfig: Partial<Record<keyof Prisma.PrescriptionInclude, Prisma.PrescriptionInclude[keyof Prisma.PrescriptionInclude]>> = {
    patient: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            contactNumber: true,
            address: true,
            patientHealthData: {
                select: {
                    bloodGroup: true,
                    gender: true,
                    dateOfBirth: true,
                },
            },
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
    medicalRecord: {
        select: {
            id: true,
            diagnosis: true,
            symptoms: true,
            clinicalNotes: true,
            treatment: true,
            advice: true,
            followUpDate: true,
            followUpNotes: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    medicines: true,
};
