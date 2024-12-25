import prisma from '../prisma-client';
import {Prisma} from '@prisma/client';

// Define the User interface
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    hashedPassword: string;
    verified: boolean;
    social?: {
        expiry?: string;
        otp?: string;
    } | null;
}

export const UserModel = {
    // Create a new user
    createUser: async (data: Prisma.UserCreateInput) => {
        return await prisma.user.create({
            data,
        });
    },


    getUserById: async (id: string): Promise<User> => {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new Error(`User with ID ${id} not found`);
        }

        return {
            ...user,
            social: user.social as User['social'], // Cast to match the `User` type
        };
    },

    getUserByEmail: async (email: string): Promise<User> => {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error(`User with email ${email} not found`);
        }

        return {
            ...user,
            social: user.social as User['social'], // Cast to match the `User` type
        };
    },

    // Get all users
    getAllUsers: async (): Promise<User[]> => {
        const users = await prisma.user.findMany();

        return users.map((user) => ({
            ...user,
            social: user.social as User['social'],
        }));
    },


    updateUser: async (id: string, data: Prisma.UserUpdateInput): Promise<User> => {
        const updatedUser = await prisma.user.update({
            where: { id },
            data,
        });

        return {
            ...updatedUser,
            social: updatedUser.social as User['social'], // Cast to match the `User` type
        };
    },

    deleteUser: async (id: string): Promise<User> => {
        const deletedUser = await prisma.user.delete({
            where: { id },
        });

        return {
            ...deletedUser,
            social: deletedUser.social as User['social'],
        };
    },
};
