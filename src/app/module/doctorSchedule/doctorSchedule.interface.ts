export interface ICreateDoctorSchedulePayload {
    doctorId?: string;
    scheduleIds: string[];
}

export interface IUpdateDoctorSchedulePayload {
    doctorId?: string;
    scheduleIds: {
        id: string;
        shouldDelete?: boolean;
    }[];
}