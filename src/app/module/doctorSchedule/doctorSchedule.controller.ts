import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DoctorScheduleService } from "./doctorSchedule.service";

const createDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;

    const result = await DoctorScheduleService.createDoctorSchedule(user, payload);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Doctor schedule created successfully",
        data: result,
    });
});

const getMyDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const query = req.query;

    const result = await DoctorScheduleService.getMyDoctorSchedules(user, query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor schedules retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getDoctorSchedulesByDoctorId = catchAsync(async (req: Request, res: Response) => {
    const { doctorId } = req.params;
    const query = req.query;

    const result = await DoctorScheduleService.getDoctorSchedulesByDoctorId(
        doctorId as string,
        query as IQueryParams
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor schedules retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getAllDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await DoctorScheduleService.getAllDoctorSchedules(query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "All doctor schedules retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getDoctorScheduleById = catchAsync(async (req: Request, res: Response) => {
    const { doctorId, scheduleId } = req.params;
    const user = req.user;

    const result = await DoctorScheduleService.getDoctorScheduleById(
        doctorId as string,
        scheduleId as string,
        user
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor schedule retrieved successfully",
        data: result,
    });
});

const updateDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;

    const result = await DoctorScheduleService.updateDoctorSchedule(user, payload);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor schedule updated successfully",
        data: result,
    });
});

const deleteDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
    const { doctorId, scheduleId } = req.params;
    const user = req.user;

    const result = await DoctorScheduleService.deleteDoctorSchedule(
        doctorId as string,
        scheduleId as string,
        user
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor schedule deleted successfully",
        data: result,
    });
});

export const DoctorScheduleController = {
    createDoctorSchedule,
    getMyDoctorSchedules,
    getDoctorSchedulesByDoctorId,
    getAllDoctorSchedules,
    getDoctorScheduleById,
    updateDoctorSchedule,
    deleteDoctorSchedule,
};
