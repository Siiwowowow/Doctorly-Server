import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PatientService } from "./patient.service";

const getMyProfile = catchAsync(
    async (req: Request, res: Response) => {
        const user = req.user;
        const result = await PatientService.getMyProfile(user);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Patient profile fetched successfully",
            data: result,
        });
    }
);

const getPatientById = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = req.user;

        const result = await PatientService.getPatientById(id as string, user);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Patient fetched successfully",
            data: result,
        });
    }
);

const updatePatient = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const payload = req.body;
        const user = req.user;

        const result = await PatientService.updatePatient(id as string, payload, user);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Patient updated successfully",
            data: result,
        });
    }
);

const deletePatient = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = req.user;

        const result = await PatientService.deletePatient(id as string, user);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Patient deleted successfully",
            data: result,
        });
    }
);

const getAllPatients = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query;

        const result = await PatientService.getAllPatients(query as IQueryParams);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Patients fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    }
);

export const PatientController = {
    getMyProfile,
    getPatientById,
    updatePatient,
    deletePatient,
    getAllPatients,
};
