import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PrescriptionService } from "./prescription.service";

const createPrescription = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;

    const result = await PrescriptionService.createPrescription(payload, user);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Prescription created successfully",
        data: result,
    });
});

const getPrescriptionById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    const result = await PrescriptionService.getPrescriptionById(id as string, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Prescription retrieved successfully",
        data: result,
    });
});

const getMyPrescriptions = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const query = req.query;

    const result = await PrescriptionService.getMyPrescriptions(user, query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "My prescriptions retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getPatientPrescriptions = catchAsync(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const user = req.user;
    const query = req.query;

    const result = await PrescriptionService.getPatientPrescriptions(patientId as string, user, query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Patient prescriptions retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getAllPrescriptions = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await PrescriptionService.getAllPrescriptions(query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "All prescriptions retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const updatePrescription = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user;

    const result = await PrescriptionService.updatePrescription(id as string, payload, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Prescription updated successfully",
        data: result,
    });
});

const deletePrescription = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    const result = await PrescriptionService.deletePrescription(id as string, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Prescription deleted successfully",
        data: result,
    });
});

export const PrescriptionController = {
    createPrescription,
    getPrescriptionById,
    getMyPrescriptions,
    getPatientPrescriptions,
    getAllPrescriptions,
    updatePrescription,
    deletePrescription,
};
