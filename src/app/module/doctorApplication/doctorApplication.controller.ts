import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DoctorApplicationService } from "./doctorApplication.service";

const initializeApplication = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const result = await DoctorApplicationService.initializeApplication(req.body, files);
    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Application initialized successfully",
        data: result,
    });
});

const getMyApplication = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await DoctorApplicationService.getMyApplication(user);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Application retrieved successfully",
        data: result,
    });
});

const updateMyApplication = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await DoctorApplicationService.updateMyApplication(user, req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Application updated successfully",
        data: result,
    });
});

const submitMyApplication = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await DoctorApplicationService.submitMyApplication(user);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Application submitted successfully",
        data: result,
    });
});

const uploadDocument = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const documentType = req.body.documentType || "DOCUMENT";
    const result = await DoctorApplicationService.uploadDocument(user, req.file, documentType);
    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Document uploaded successfully",
        data: result,
    });
});

const deleteDocument = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const documentId = req.params.documentId as string;
    const result = await DoctorApplicationService.deleteDocument(user, documentId);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Document deleted successfully",
        data: result,
    });
});

// Admin Controllers
const getAllApplications = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await DoctorApplicationService.getAllApplications(query as IQueryParams);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor applications fetched successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getApplicationById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DoctorApplicationService.getApplicationById(id as string);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor application fetched successfully",
        data: result,
    });
});

const updateApplicationStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const result = await DoctorApplicationService.updateApplicationStatus(id as string, newStatus);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor application status updated successfully",
        data: result,
    });
});

const verifyDocument = catchAsync(async (req: Request, res: Response) => {
    const { id, documentId } = req.params;
    const result = await DoctorApplicationService.verifyDocument(id as string, documentId as string, req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Document verification status updated successfully",
        data: result,
    });
});

const approveApplication = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await DoctorApplicationService.approveApplication(id as string, user);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor application approved successfully",
        data: result,
    });
});

const rejectApplication = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await DoctorApplicationService.rejectApplication(id as string, req.body, user);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor application rejected successfully",
        data: result,
    });
});

const requestResubmission = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await DoctorApplicationService.requestResubmission(id as string, req.body, user);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor application resubmission requested successfully",
        data: result,
    });
});

const trackApplication = catchAsync(async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const result = await DoctorApplicationService.trackApplication(identifier as string);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Doctor application tracking retrieved successfully",
        data: result,
    });
});

export const DoctorApplicationController = {
    initializeApplication,
    getMyApplication,
    updateMyApplication,
    submitMyApplication,
    uploadDocument,
    deleteDocument,
    trackApplication,
    // Admin Controllers
    getAllApplications,
    getApplicationById,
    updateApplicationStatus,
    verifyDocument,
    approveApplication,
    rejectApplication,
    requestResubmission,
};
