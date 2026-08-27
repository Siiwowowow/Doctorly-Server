import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { logger } from "./logger";

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await prisma.user.findFirst({
            where:{
                role : Role.SUPER_ADMIN
            }
        })

        if(isSuperAdminExist) {
            logger.info("Super admin already exists. Skipping seeding super admin.");
            return;
        }

        const superAdminUser = await auth.api.signUpEmail({
            body:{
                email : envVars.SUPER_ADMIN_EMAIL,
                password : envVars.SUPER_ADMIN_PASSWORD,
                name : "Super Admin",
                role : Role.SUPER_ADMIN,
                needPasswordChange : false,
                rememberMe : false,
            }
        })

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where : {
                    id : superAdminUser.user.id
                },
                data : {
                    emailVerified : true,
                }
            });

            await tx.admin.create({
                data : {
                    userId : superAdminUser.user.id,
                    name : "Super Admin",
                    email : envVars.SUPER_ADMIN_EMAIL,
                }
            })

            
            
        });

        const superAdmin = await prisma.admin.findFirst({
            where : {
                email : envVars.SUPER_ADMIN_EMAIL,
            },
            include : {
                user : true,
            }
        })

        logger.info(`Super Admin initialized: ${superAdmin?.email}`);
    } catch (error) {
        logger.error("Error seeding super admin: ", error);
        try {
            await prisma.user.deleteMany({
                where: {
                    email: envVars.SUPER_ADMIN_EMAIL,
                },
            });
        } catch (cleanupError) {
            logger.error("Failed to clean up super admin after error:", cleanupError);
        }
    }
}