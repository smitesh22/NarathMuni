import { ContentObjectsModel } from "../../database/models/content-objects";
import {JsonValue} from "@prisma/client/runtime/library";

export interface ContentObject {
    id: string;
    type: string;
    extensions: JsonValue;
    updatedOn: Date;
    createdOn: Date;
}

export interface ContentObjectExtensions {
    [`content-object-extension/mimetype`]?: string;
    [`content-object-extension/name`]?: string;
    [`content-object-extension/size`]?: number;
    [`content-object-extension/bucket`]?: string;
    [`content-object-extension/location`]?: string;
    [`content-object-extension/user`]?: string;
}


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
