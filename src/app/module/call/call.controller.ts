import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CallService } from "./call.service";

const initiateCall = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await CallService.initiateCall(user, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Call initiated successfully",
        data: result,
    });
});

const getMyCallHistory = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await CallService.getMyCallHistory(user, req.query);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Call history retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getCallById = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const callId = String(req.params.callId);
    const result = await CallService.getCallById(callId, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Call details retrieved successfully",
        data: result,
    });
});

const getIceServers = catchAsync(async (req: Request, res: Response) => {
    const result = await CallService.getIceServers(req.user);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "ICE servers retrieved successfully",
        data: result,
    });
});

const acceptCall = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const callId = String(req.params.callId);
    const result = await CallService.acceptCall(callId, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Call accepted successfully",
        data: result,
    });
});

const rejectCall = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const callId = String(req.params.callId);
    const result = await CallService.rejectCall(callId, user, req.body.reason);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Call rejected successfully",
        data: result,
    });
});

const cancelCall = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const callId = String(req.params.callId);
    const result = await CallService.cancelCall(callId, user, req.body.reason);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Call canceled successfully",
        data: result,
    });
});

const endCall = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const callId = String(req.params.callId);
    const result = await CallService.endCall(callId, user, req.body.reason);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Call ended successfully",
        data: result,
    });
});

export const CallController = {
    initiateCall,
    getMyCallHistory,
    getCallById,
    getIceServers,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
};
