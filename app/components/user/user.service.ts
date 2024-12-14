import { UserModel } from '../../database/models/user'

export const userService = {
    createUser: (data: { email: string; firstName: string; lastName: string }) => {
        return UserModel.createUser(data)
    },

    getUserById: (id: number) => {
        return UserModel.getUserById(id)
    },

    getAllUsers: () => {
        return UserModel.getAllUsers()
    },

    updateUser: (id: number, data: { email?: string; firstName?: string; lastName?: string }) => {
        return UserModel.updateUser(id, data)
    },

    deleteUser: (id: number) => {
        return UserModel.deleteUser(id)
    },
}
