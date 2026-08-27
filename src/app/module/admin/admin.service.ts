import status from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { IUpdateAdminPayload } from "./admin.interface";

const getAllAdmins = async () => {
    const admins = await prisma.admin.findMany({
        where: {
            isDeleted: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
    return admins;
};

const getAdminById = async (id: string) => {
    const admin = await prisma.admin.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    if (!admin) {
        throw new AppError(status.NOT_FOUND, "Admin not found");
    }

    return admin;
};

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
    const isAdminExist = await prisma.admin.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!isAdminExist) {
        throw new AppError(status.NOT_FOUND, "Admin not found");
    }

    const { admin } = payload;

    const updatedAdmin = await prisma.admin.update({
        where: {
            id,
        },
        data: {
            ...admin,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                },
            },
        },
    });

    return updatedAdmin;
};

// Soft delete admin user by setting isDeleted to true and invalidate sessions
const deleteAdmin = async (id: string, user: IRequestUser) => {
    const isAdminExist = await prisma.admin.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!isAdminExist) {
        throw new AppError(status.NOT_FOUND, "Admin not found");
    }

    if (isAdminExist.userId === user.userId) {
        throw new AppError(status.BAD_REQUEST, "You cannot delete your own account");
    }

    const adminUser = await prisma.user.findUnique({
        where: { id: isAdminExist.userId },
    });

    if (adminUser?.role === Role.SUPER_ADMIN) {
        const activeSuperAdminCount = await prisma.user.count({
            where: {
                role: Role.SUPER_ADMIN,
                isDeleted: false,
                status: UserStatus.ACTIVE,
            },
        });

        if (activeSuperAdminCount <= 1) {
            throw new AppError(
                status.BAD_REQUEST,
                "Cannot delete or deactivate the last remaining Super Admin account"
            );
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        await tx.admin.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        await tx.user.update({
            where: { id: isAdminExist.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: UserStatus.DELETED,
            },
        });

        await tx.session.deleteMany({
            where: { userId: isAdminExist.userId },
        });

        return { message: "Admin deleted successfully" };
    });

    return result;
};

export const AdminService = {
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
};
