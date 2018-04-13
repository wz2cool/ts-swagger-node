import * as lodash from "lodash";
import { RequestMappingCache } from "../cache";
import { CommonHelper } from "../helper";
import { RequestArgument, RequestMappingInfo, RequestMethod } from "../model";

export function registerRequestMapping(
    tag: { new(): any } | string, path: string, method: RequestMethod, requestArguments: RequestArgument[]) {
    const cache = RequestMappingCache.getInstance();
    const requestMappingInfo = new RequestMappingInfo();
    const tagStr: string = typeof tag === "function" ? CommonHelper.getModelName(tag) : tag;

    requestMappingInfo.tag = tagStr;
    requestMappingInfo.unqiueKey = generateUniqueKey(path, method, requestArguments);
    requestMappingInfo.path = path;
    requestMappingInfo.method = method;
    requestMappingInfo.requestArguments = requestArguments;
    cache.cacheRequestMappingInfo(requestMappingInfo);
}

function generateUniqueKey(path: string, method: RequestMethod, requestArguments: RequestArgument[]): string {
    const methodStr = RequestMethod[method];
    let requestArgumentStr: string;
    if (CommonHelper.isNullOrUndefined(requestArguments)) {
        requestArgumentStr = "";
    } else {
        const argNames = lodash.map(requestArguments, (x) => x.name);
        requestArgumentStr = lodash.join(argNames, "-");
    }

    return `path:${path}_method:${methodStr}_arg:${requestArgumentStr}`;
}
