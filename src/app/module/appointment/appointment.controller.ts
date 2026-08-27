import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AppointmentService } from "./appointment.service";

const createAppointment = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;

    const result = await AppointmentService.createAppointment(payload, user);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Appointment booked successfully",
        data: result,
    });
});

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const query = req.query;

    const result = await AppointmentService.getMyAppointments(user, query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Appointments retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getAppointmentById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    const result = await AppointmentService.getAppointmentById(id as string, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Appointment retrieved successfully",
        data: result,
    });
});

const changeAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user;

    const result = await AppointmentService.changeAppointmentStatus(id as string, payload, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Appointment status updated successfully",
        data: result,
    });
});

const cancelAppointment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    const result = await AppointmentService.cancelAppointment(id as string, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Appointment cancelled successfully",
        data: result,
    });
});

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await AppointmentService.getAllAppointments(query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "All appointments retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

export const AppointmentController = {
    createAppointment,
    getMyAppointments,
    getAppointmentById,
    changeAppointmentStatus,
    cancelAppointment,
    getAllAppointments,
};