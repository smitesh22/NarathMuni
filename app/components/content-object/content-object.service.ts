import {ContentObjectsModel} from "../../database/models/content-objects";

export const contentObjectService = {
    createContentObject: async (data: {
        id: string,
        type: string,
        extensions: object,
        createdOn: Date,
        updatedOn: Date} ) => {
        return ContentObjectsModel.createContentObject(data);
    },
    getContentObjectById: async (id: string) => {
        return ContentObjectsModel.getContentObjectById(id)
    },
    getContentObjects: async() => {
        return ContentObjectsModel.getContentObjects()
    },
    deleteContentObjectById: async (id: string) => {
        return await ContentObjectsModel.deleteContentObjectById(id)
    }
}