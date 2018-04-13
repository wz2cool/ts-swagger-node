import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import * as swaggerUi from "swagger-ui-express";
import { registerApiModel, registerRequestMapping, swaggerJSDoc } from "../src";
import { ApiModelCache, RequestMappingCache } from "../src/cache";
import { ApiPropertyInfo, DataType, SwaggerInfoProperty, SwaggerOptions } from "../src/model";
import { StudentApi } from "./apis";
import { Student } from "./model/student";

export class Server {
    public static bootstrap(): Server {
        return new Server();
    }

    public readonly app: express.Application;
    constructor() {
        this.app = express();
        this.config();
    }

    private config(): void {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.routes();
        this.initSwagger();
    }

    private routes(): void {
        const studentApi = new StudentApi();
        this.app.use("/students", studentApi.getRoute());
    }

    private initSwagger(): void {
        registerApiModel(Student);
        const options = new SwaggerOptions();
        options.info = new SwaggerInfoProperty();
        options.info.version = "1.0.0";
        options.info.title = "testSwagger";

        const jsDoc = swaggerJSDoc(options);
        this.app.get("/api-docs.json", (req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.send(jsDoc);
        });

        const o = {
            swaggerUrl: "/api-docs.json",
        };

        this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, o));
    }
}
