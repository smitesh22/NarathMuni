import prisma from '../prisma-client'

export interface User {
    id: number
    email: string
    firstName: string
    lastName: string
    social?: Record<string, unknown> // Optional JSON field
}

export const UserModel = {
    createUser: async (data: { email: string; firstName: string; lastName: string }) => {
        return await prisma.user.create({
            data,
        })
    },

    getUserById: async (id: number) => {
        return await prisma.user.findUnique({
            where: { id },
        })
    },

    getAllUsers: async () => {
        return await prisma.user.findMany()
    },

    updateUser: async (id: number, data: { email?: string; firstName?: string; lastName?: string }) => {
        return await prisma.user.update({
            where: { id },
            data,
        })
    },

    deleteUser: async (id: number) => {
        return await prisma.user.delete({
            where: { id },
        })
    },
}
