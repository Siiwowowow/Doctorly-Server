import status from "http-status";
import { Service } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateServicePayload, IUpdateServicePayload } from "./service.interface";

const createService = async (payload: ICreateServicePayload): Promise<Service> => {
    const existingService = await prisma.service.findUnique({ where: { slug: payload.slug } });
    if (existingService) {
        throw new AppError(status.CONFLICT, "A service with this slug already exists");
    }
    return prisma.service.create({ data: payload });
};

const getAllServices = async (): Promise<Service[]> => {
    return prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
};

const updateService = async (id: string, payload: IUpdateServicePayload): Promise<Service> => {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError(status.NOT_FOUND, "Service not found");
    return prisma.service.update({ where: { id }, data: payload });
};

const deleteService = async (id: string): Promise<Service> => {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError(status.NOT_FOUND, "Service not found");
    return prisma.service.update({ where: { id }, data: { isActive: false } });
};

export const ServiceService = {
    createService,
    getAllServices,
    updateService,
    deleteService,
};
