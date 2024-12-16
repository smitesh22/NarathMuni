import prisma from '../prisma-client';
import { Prisma } from '@prisma/client';

// Define the User interface (can be replaced with Prisma types directly if available)
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    hashedPassword: string;
    social?: Record<string, unknown>; // Optional JSON field
}

export const UserModel = {
    // Create a new user
    createUser: async (data: Prisma.UserCreateInput) => {
        return await prisma.user.create({
            data,
        });
    },

    // Get a user by ID
    getUserById: async (id: string) => {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new Error(`User with ID ${id} not found`);
        }
        return user;
    },

    getUserByEmail: async (email: string) => {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            throw new Error(`User with email ${email} not found`);
        }
        return user;
    },

    // Get all users
    getAllUsers: async () => {
        return await prisma.user.findMany();
    },

    // Update a user by ID
    updateUser: async (id: string, data: Prisma.UserUpdateInput) => {
        return await prisma.user.update({
            where: { id },
            data,
        });
    },

    // Delete a user by ID
    deleteUser: async (id: string) => {
        return await prisma.user.delete({
            where: { id },
        });
    },
};

UserModel;
