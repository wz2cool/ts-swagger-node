import * as lodash from "lodash";
import { ApiModelCache, RequestMappingCache } from "../cache";
import { CommonHelper } from "../helper";
import {
    ApiPropertyInfo,
    DataType,
    PathVariable,
    RequestBody,
    RequestMappingInfo,
    RequestMethod,
    RequestParam,
    RequestParameter,
    ResponseBody,
} from "../model";

export class SwaggerHelper {
    public static generateDefinitions(
        propertyCache: { [modelName: string]: { [property: string]: ApiPropertyInfo } }): any {
        const result = {};
        for (const modelName in propertyCache) {
            if (propertyCache.hasOwnProperty(modelName)) {
                const propertyMap = propertyCache[modelName];
                const apiPropertyInfos = lodash.values(propertyMap);
                result[modelName] = SwaggerHelper.generateModelDefinition(apiPropertyInfos);
            }
        }
        return result;
    }

    public static generatePaths(requestMappingInfos: RequestMappingInfo[]): any {
        const pathGroup = lodash.groupBy(requestMappingInfos, "path");
        const result: any = {};
        for (const key in pathGroup) {
            if (pathGroup.hasOwnProperty(key)) {
                const pathDef: any = {};
                const groupRequestMappingInfos = pathGroup[key];
                for (const requestMappingInfo of groupRequestMappingInfos) {
                    const tags: string[] = [requestMappingInfo.tag];
                    const consumes: string[] = ["application/json"];
                    const produces: string[] = ["application/json"];
                    const parameters: any[] = [];
                    const responses: any = {};

                    if (!CommonHelper.isNullOrUndefined(requestMappingInfo.requestArguments)) {
                        for (const requestArgument of requestMappingInfo.requestArguments) {
                            const parameter = SwaggerHelper.generatePathParameter(requestArgument);
                            parameters.push(parameter);
                        }
                    }

                    responses[200] = SwaggerHelper.generateResponse(requestMappingInfo.responseBody);
                    const methodDef: any = {};
                    methodDef.tags = tags;
                    methodDef.consumes = consumes;
                    methodDef.produces = produces;
                    methodDef.parameters = parameters;
                    methodDef.responses = responses;
                    methodDef.summary = requestMappingInfo.summary;
                    const requestMethod = RequestMethod[requestMappingInfo.method].toLowerCase();
                    pathDef[requestMethod] = methodDef;
                }
                result[key] = pathDef;
            }
        }

        return result;
    }

    public static generateModelDefinition(apiPropertyInfos: ApiPropertyInfo[]): any {
        const required: string[] = [];
        const properties: any = {};

        for (const apiPropertyInfo of apiPropertyInfos) {
            const propertyName = apiPropertyInfo.propertyName;
            if (apiPropertyInfo.required) {
                required.push(propertyName);
            }
            const propTypeDef: any = SwaggerHelper.generatePropertyDef(
                apiPropertyInfo.dataType, apiPropertyInfo.refModel) || {};
            propTypeDef.type = DataType[apiPropertyInfo.dataType];
            propTypeDef.description = apiPropertyInfo.description;
            properties[propertyName] = propTypeDef;
        }

        const modelDef: any = {};
        modelDef.type = "object";
        modelDef.required = required;
        modelDef.properties = properties;
        return modelDef;
    }

    public static generatePathParameter(requestArgument: RequestParameter): any {
        const result: any = {};
        result.description = requestArgument.description;
        if (requestArgument instanceof RequestBody) {
            result.in = "body";
            result.name = requestArgument.name;
            result.required = true;
            const refModel: any = {};
            const modelName = CommonHelper.getModelName(requestArgument.refModel);
            refModel.$ref = `#/definitions/${modelName}`;
            result.schema = refModel;
        } else if (requestArgument instanceof RequestParam) {
            result.in = "query";
            result.name = requestArgument.name;
            result.required = requestArgument.required;
            result.type = DataType[requestArgument.dataType];
        } else if (requestArgument instanceof PathVariable) {
            result.in = "path";
            result.name = requestArgument.name;
            result.required = true;
            result.type = DataType[requestArgument.dataType];
        }
        return result;
    }

    public static generateResponse(responseBody: ResponseBody): any {
        const result: any = {};
        result.description = responseBody.description;
        const typeStr = DataType[responseBody.dataType];
        result.type = typeStr;
        result.schema = SwaggerHelper.generatePropertyDef(responseBody.dataType, responseBody.refModel);
        return result;
    }

    private static generatePropertyDef(dataType: DataType, refModel: { new(): any } | DataType): any {
        if (CommonHelper.isNullOrUndefined(refModel)) {
            return undefined;
        }

        const propTypeDef: any = {};
        if (typeof refModel === "function") {
            const refModelStr = CommonHelper.getModelName(refModel);
            switch (dataType) {
                case DataType.array:
                    propTypeDef.items = {
                        $ref: `#/definitions/${refModelStr}`,
                    };
                    break;
                case DataType.object:
                    propTypeDef.$ref = `#/definitions/${refModelStr}`;
                    break;
            }
        } else {
            switch (dataType) {
                case DataType.array:
                    propTypeDef.items = {
                        type: DataType[refModel],
                    };
                    break;
            }
        }
        return propTypeDef;
    }
}
