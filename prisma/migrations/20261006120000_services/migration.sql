CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "icon" VARCHAR(60),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");
CREATE INDEX "idx_services_active_sortOrder" ON "services"("isActive", "sortOrder");

INSERT INTO "services" ("id", "title", "slug", "description", "icon", "sortOrder", "updatedAt") VALUES
('0199f7d0-7d7a-7a2d-b5d0-000000000001', 'Video Consultation', 'video-consultation', 'Talk to certified doctors from anywhere through secure video visits.', 'video', 1, CURRENT_TIMESTAMP),
('0199f7d0-7d7a-7a2d-b5d0-000000000002', 'Live Chat with Doctors', 'live-chat', 'Get quick answers to your health questions from trusted clinicians.', 'chat', 2, CURRENT_TIMESTAMP),
('0199f7d0-7d7a-7a2d-b5d0-000000000003', 'E-Prescription', 'e-prescription', 'Receive digital prescriptions instantly after your consultation.', 'prescription', 3, CURRENT_TIMESTAMP),
('0199f7d0-7d7a-7a2d-b5d0-000000000004', 'Lab Tests at Home', 'lab-tests-at-home', 'Book diagnostic tests with convenient sample collection at home.', 'lab', 4, CURRENT_TIMESTAMP),
('0199f7d0-7d7a-7a2d-b5d0-000000000005', 'Medicine Delivery', 'medicine-delivery', 'Get essential medicines delivered safely to your doorstep.', 'medicine', 5, CURRENT_TIMESTAMP),
('0199f7d0-7d7a-7a2d-b5d0-000000000006', 'Health Records', 'health-records', 'Access and manage your important health records in one place.', 'records', 6, CURRENT_TIMESTAMP);
