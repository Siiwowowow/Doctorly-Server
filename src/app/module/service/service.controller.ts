import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ServiceService } from "./service.service";

const createService = catchAsync(async (req: Request, res: Response) => {
    const result = await ServiceService.createService(req.body);
    sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: "Service created successfully", data: result });
});

const getAllServices = catchAsync(async (_req: Request, res: Response) => {
    const result = await ServiceService.getAllServices();
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Services fetched successfully", data: result });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
    const result = await ServiceService.updateService(req.params.id as string, req.body);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Service updated successfully", data: result });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
    const result = await ServiceService.deleteService(req.params.id as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Service deleted successfully", data: result });
});

export const ServiceController = {
    createService,
    getAllServices,
    updateService,
    deleteService,
};
