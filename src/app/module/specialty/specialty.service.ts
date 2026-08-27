import status from "http-status";
import { Specialty } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateSpecialtyPayload } from "./specialty.interface";

const createSpecialty = async (payload: ICreateSpecialtyPayload): Promise<Specialty> => {
    const existingSpecialty = await prisma.specialty.findUnique({
        where: {
            title: payload.title,
        },
    });

    if (existingSpecialty) {
        if (!existingSpecialty.isDeleted) {
            throw new AppError(status.CONFLICT, "Specialty with this title already exists");
        }

        // If previously soft-deleted, reactivate and update
        const reactivatedSpecialty = await prisma.specialty.update({
            where: { id: existingSpecialty.id },
            data: {
                ...payload,
                isDeleted: false,
                deletedAt: null,
            },
        });
        return reactivatedSpecialty;
    }

    const specialty = await prisma.specialty.create({
        data: {
            title: payload.title,
            description: payload.description,
            icon: payload.icon,
        },
    });

    return specialty;
};

const getAllSpecialties = async (): Promise<Specialty[]> => {
    const specialties = await prisma.specialty.findMany({
        where: {
            isDeleted: false,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return specialties;
};

const deleteSpecialty = async (id: string): Promise<Specialty> => {
    const specialty = await prisma.specialty.findUnique({
        where: { id },
    });

    if (!specialty || specialty.isDeleted) {
        throw new AppError(status.NOT_FOUND, "Specialty not found");
    }

    // Check if any active doctors are using this specialty
    const activeDoctorCount = await prisma.doctorSpecialty.count({
        where: {
            specialtyId: id,
            doctor: {
                isDeleted: false,
            },
        },
    });

    if (activeDoctorCount > 0) {
        throw new AppError(
            status.BAD_REQUEST,
            `Cannot delete specialty because it is currently assigned to ${activeDoctorCount} active doctor(s)`
        );
    }

    const updatedSpecialty = await prisma.specialty.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return updatedSpecialty;
};

export const SpecialtyService = {
    createSpecialty,
    getAllSpecialties,
    deleteSpecialty,
};