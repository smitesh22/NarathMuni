import { UserModel } from '../../database/models/user'

export const userService = {
    createUser: (data: { id: string; email: any; firstName: any; lastName: any; hashedPassword: any }) => {
        return UserModel.createUser(data)
    },

    getUserById: (id: string) => {
        return UserModel.getUserById(id)
    },

    getUserByEmail: (email: string) => {
        return UserModel.getUserByEmail(email)
    },

    getAllUsers: () => {
        return UserModel.getAllUsers()
    },

    updateUser: (id: string, data: { email?: string; firstName?: string; lastName?: string }) => {
        return UserModel.updateUser(id, data)
    },

    deleteUser: (id: string) => {
        return UserModel.deleteUser(id)
    },
}
