//
import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { memoryCache } from "../../utils/cache";
import { DoctorService } from "./doctor.service";

const getAllDoctors = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query;
        const cacheKey = `doctors:list:${JSON.stringify(query)}`;

        const result = await memoryCache.getOrSet(
            cacheKey,
            60, // 60s TTL for public search/listing
            () => DoctorService.getAllDoctors(query as IQueryParams),
            ["doctors"]
        );

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctors fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    }
);

const getDoctorById = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const cacheKey = `doctors:detail:${id}`;

        const doctor = await memoryCache.getOrSet(
            cacheKey,
            60, // 60s TTL
            () => DoctorService.getDoctorById(id as string),
            ["doctors"]
        );

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor fetched successfully",
            data: doctor,
        });
    }
);

const updateDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const payload = req.body;

        const updatedDoctor = await DoctorService.updateDoctor(id as string, payload);
        memoryCache.invalidateTag("doctors");

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor updated successfully",
            data: updatedDoctor,
        });
    }
);

const deleteDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const result = await DoctorService.deleteDoctor(id as string);
        memoryCache.invalidateTag("doctors");

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor deleted successfully",
            data: result,
        });
    }
);

const updateMyProfile = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;
        const user = req.user;

        const updatedDoctor = await DoctorService.updateMyProfile(payload, user);
        memoryCache.invalidateTag("doctors");

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor profile updated successfully",
            data: updatedDoctor,
        });
    }
);

export const DoctorController = {
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    updateMyProfile,
    deleteDoctor,
};