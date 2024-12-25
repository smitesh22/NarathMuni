import {ContentObject, ContentObjectExtensions, ContentObjectsModel} from "../../database/models/content-objects";

export const contentObjectService = {
    createContentObject: async (data: {
        id: string;
        type: string;
        extensions: ContentObjectExtensions;
        createdOn: Date;
        updatedOn: Date;
    }): Promise<ContentObject>=> {
        return ContentObjectsModel.createContentObject(data);
    },

    getContentObjectById: async (id: string): Promise<ContentObject|null> => {
        return ContentObjectsModel.getContentObjectById(id);
    },

    getContentObjects: async (): Promise<ContentObject[]> => {
        return ContentObjectsModel.getContentObjects();
    },

    deleteContentObjectById: async (id: string): Promise<void> => {
        await ContentObjectsModel.deleteContentObjectById(id);
    }
}
