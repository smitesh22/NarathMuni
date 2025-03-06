import { UserModel } from "../../database/models/user";

export const userService = {
  createUser: (data: {
    id: string;
    email: any;
    firstName: any;
    lastName: any;
    hashedPassword: any;
    extensions: any;
  }) => {
    return UserModel.createUser(data);
  },

  getUserById: (id: string) => {
    return UserModel.getUserById(id);
  },

  getUserByEmail: (email: string) => {
    return UserModel.getUserByEmail(email);
  },

  getAllUsers: () => {
    return UserModel.getAllUsers();
  },
  getUserByCustomerId: async (customerId: string) => {
    const users = await UserModel.getAllUsers();
    console.log(customerId);

    const user = users.find(
        (u) => u.extensions && u.extensions.userTypes?.customerId === customerId
    );

    if (!user) {
      return null;
    } else {
      return user;
    }
  },

  deleteUser: (id: string) => {
    return UserModel.deleteUser(id);
  },

  isUserPrivileged: async (id: string) => {
    const user = await UserModel.getUserById(id);
    if (!user) {
      return false;
    }
    return user.privileged;
  },
  updateUser: (
      id: string,
      data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        hashedPassword?: string;
        verified?: boolean;
        extensions?: any;
        privileged?: boolean;
      },
  ) => {
    return UserModel.updateUser(id, data);
  },
};
