export interface ICreateMedicalRecordPayload {
    appointmentId: string;
    diagnosis: string;
    symptoms: string;
    clinicalNotes?: string;
    treatment?: string;
    advice?: string;
    followUpDate?: string;
    followUpNotes?: string;
}

export interface IUpdateMedicalRecordPayload {
    diagnosis?: string;
    symptoms?: string;
    clinicalNotes?: string;
    treatment?: string;
    advice?: string;
    followUpDate?: string;
    followUpNotes?: string;
}
