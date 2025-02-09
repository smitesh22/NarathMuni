import prisma from "../prisma-client";
import { Prisma } from "@prisma/client";

// Define the User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  hashedPassword: string;
  verified: boolean;
  privileged: boolean;
  extensions: {
    expiry?: string;
    otp?: string;
    userTypes: UserType;
  } | null;
}

export interface UserType {
  subscriptionType?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  stripeSubscriptionId?: string;
  customerId?: string;
}

export const UserModel = {
  createUser: async (data: Prisma.UserCreateInput): Promise<User> => {
    const newUser = await prisma.user.create({
      data,
    });

    return {
      ...newUser,
      extensions: newUser.extensions as User["extensions"],
    };
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
      extensions: user.extensions as User["extensions"], // Cast to match the `User` type
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
      extensions: user.extensions as User["extensions"], // Cast to match the `User` type
    };
  },

  getUserByEmailIfExists: async (email: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      extensions: user.extensions as User["extensions"], // Cast to match the `User` type
    };
  },

  // Get all users
  updateUser: async (
      id: string,
      data: Prisma.UserUpdateInput,
  ): Promise<User> => {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return {
      ...updatedUser,
      extensions: updatedUser.extensions as User["extensions"], // Cast to match the `User` type
    };
  },

  getAllUsers: async (): Promise<User[]> => {
    const users = await prisma.user.findMany();

    return users.map((user) => ({
      ...user,
      extensions: user.extensions as User["extensions"],
    }));
  },

  deleteUser: async (id: string): Promise<User> => {
    const deletedUser = await prisma.user.delete({
      where: { id },
    });

    return {
      ...deletedUser,
      extensions: deletedUser.extensions as User["extensions"],
    };
  },
};
