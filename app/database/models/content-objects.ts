import prisma from '../prisma-client';
import {Prisma} from "@prisma/client";

export interface ContentObject {
    id: string;
    type: string;
    extensions: ContentObjectExtensions
    createdOn: Date;
    updatedOn: Date;
}

export interface ContentObjectExtensions {
    [`content-object-extension/mimetype`]?: string;
    [`content-object-extension/name`]?: string;
    [`content-object-extension/size`]?: number;
    [`content-object-extension/bucket`]?: string;
    [`content-object-extension/location`]?: string;
    [`content-object-extension/user`]?: string;
}

export const ContentObjectsModel = {
    createContentObject: async (data: {
        id: string;
        type: string;
        extensions: ContentObjectExtensions;
        createdOn: Date;
        updatedOn: Date;
    }): Promise<ContentObject> => {
        const extensions = data.extensions as Prisma.JsonObject
        const contentObject =  await prisma.contentObject.create({
            data: {
                id: data.id,
                type: data.type,
                extensions: extensions,
                createdOn: data.createdOn,
                updatedOn: data.updatedOn,
            },
        });

        return {
            ...contentObject,
            extensions: contentObject.extensions as ContentObjectExtensions,
        }
    },

    getContentObjectById: async (id: string): Promise<ContentObject | null> => {
        const contentObject =  await prisma.contentObject.findUnique({
            where: { id },
        });

        if (!contentObject) return null;
        return{
            ...contentObject,
            extensions: contentObject.extensions as ContentObjectExtensions
        }
    },

    getContentObjects: async (): Promise<ContentObject[]> => {
        const contentObjects = await prisma.contentObject.findMany({});
        return contentObjects.map((contentObject) => ({
            ...contentObject,
            extensions: contentObject.extensions as ContentObjectExtensions,
        }));
    },
    getContentObjectByUserGuid: async (userGuid: string): Promise<ContentObject[]> => {
        const contentObjects = await prisma.contentObject.findMany({
            where: {
                extensions: {
                    path: ['content-object-extension/user'], // Correct JSONB filtering
                    equals: userGuid
                }
            }
        });
        if (!contentObjects || contentObjects.length === 0) return [];

        return contentObjects.map(obj => ({
            ...obj,
            extensions: obj.extensions as ContentObjectExtensions
        }));
    },

    deleteContentObjectById: async (id: string): Promise<void> => {
        await prisma.contentObject.deleteMany({
            where: { id },
        });
    }
};
