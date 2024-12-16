import prisma from '../prisma-client';
import { Prisma } from '@prisma/client';
import {randomUUID} from "node:crypto";

export interface ContentObject {
    id: string;
    type: string;
    extension : object
}

export const ContentObjectsModel = {
    createContentObject: async (data: {
        id: string,
        type: string,
        extensions: object,
        createdOn: Date,
        updatedOn: Date}) => {
        return await prisma.contentObject.create({
            data
        });
    },
    getContentObjectById: async (id: string) => {
        return await prisma.contentObject.findUnique({
            where: {id},
        });
    },
    getContentObjects: async() => {
        return await prisma.contentObject.findMany({})
    },
    deleteContentObjectById: async (id: string) => {
        return await prisma.contentObject.deleteMany({
            where: {id},
        })
    }
}
