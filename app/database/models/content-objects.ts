import prisma from '../prisma-client';

export const ContentObjectsModel = {
    createContentObject: async (data: {
        id: string;
        type: string;
        extensions: object;
        createdOn: Date;
        updatedOn: Date;
    }) => {
        return await prisma.contentObject.create({
            data: {
                id: data.id,
                type: data.type,
                extensions: data.extensions,
                createdOn: data.createdOn,
                updatedOn: data.updatedOn,
            },
        });
    },

    getContentObjectById: async (id: string) => {
        return await prisma.contentObject.findUnique({
            where: { id },
        });
    },

    getContentObjects: async () => {
        return await prisma.contentObject.findMany({});
    },

    deleteContentObjectById: async (id: string): Promise<void> => {
        await prisma.contentObject.deleteMany({
            where: { id },
        });
    }
};
