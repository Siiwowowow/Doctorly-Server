import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { MedicalRecordService } from "./medicalRecord.service";

const createMedicalRecord = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;

    const result = await MedicalRecordService.createMedicalRecord(payload, user);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Medical record created successfully",
        data: result,
    });
});

const getMedicalRecordById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    const result = await MedicalRecordService.getMedicalRecordById(id as string, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Medical record retrieved successfully",
        data: result,
    });
});

const getMyMedicalRecords = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const query = req.query;

    const result = await MedicalRecordService.getMyMedicalRecords(user, query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "My medical records retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getPatientMedicalRecords = catchAsync(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const user = req.user;
    const query = req.query;

    const result = await MedicalRecordService.getPatientMedicalRecords(patientId as string, user, query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Patient medical records retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getAllMedicalRecords = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await MedicalRecordService.getAllMedicalRecords(query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "All medical records retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const updateMedicalRecord = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user;

    const result = await MedicalRecordService.updateMedicalRecord(id as string, payload, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Medical record updated successfully",
        data: result,
    });
});

const deleteMedicalRecord = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    const result = await MedicalRecordService.deleteMedicalRecord(id as string, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Medical record deleted successfully",
        data: result,
    });
});

export const MedicalRecordController = {
    createMedicalRecord,
    getMedicalRecordById,
    getMyMedicalRecords,
    getPatientMedicalRecords,
    getAllMedicalRecords,
    updateMedicalRecord,
    deleteMedicalRecord,
};
