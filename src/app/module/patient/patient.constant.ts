import { Prisma } from "../../../generated/prisma/client";

export const patientSearchableFields = ["name", "email", "contactNumber", "address"];

export const patientFilterableFields = [
    "isDeleted",
    "email",
    "contactNumber",
    "address",
    "patientHealthData.gender",
    "patientHealthData.bloodGroup",
    "patientHealthData.hasDiabetes",
    "patientHealthData.hasAllergies",
];

export const patientIncludeConfig: Partial<Record<keyof Prisma.PatientInclude, Prisma.PatientInclude[keyof Prisma.PatientInclude]>> = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    patientHealthData: true,
    appointments: {
        include: {
            doctor: true,
            schedule: true,
        },
    },
    prescriptions: true,
    medicalReports: true,
    medicalRecords: true,
    reviews: true,
};
