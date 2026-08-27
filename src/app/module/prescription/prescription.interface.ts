export interface IPrescriptionMedicinePayload {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    instructions?: string;
}

export interface ICreatePrescriptionPayload {
    appointmentId: string;
    medicalRecordId?: string;
    instructions?: string;
    notes?: string;
    advice?: string;
    followUpDate?: string;
    medicines: IPrescriptionMedicinePayload[];
}

export interface IUpdatePrescriptionPayload {
    instructions?: string;
    notes?: string;
    advice?: string;
    followUpDate?: string;
    medicines?: IPrescriptionMedicinePayload[];
}
