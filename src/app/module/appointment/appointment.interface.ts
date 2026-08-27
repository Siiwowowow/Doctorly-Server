import { AppointmentStatus } from "../../../generated/prisma/enums";

export interface IBookAppointmentPayload {
    doctorId: string;
    scheduleId: string;
}

export interface IUpdateAppointmentStatusPayload {
    status: AppointmentStatus;
}