import {EaptainCli} from 'eaptain-cli'
import {ClientOpts} from 'redis'
import * as koa from 'koa'
import * as koaRouter from 'koa-router'
import * as httProxy from 'http-proxy'
import * as favicon from 'koa-favicon'
import * as path from 'path'

export class Proxy {

    private eaptain: EaptainCli;

    private config: ClientOpts;

    private port: number;

    private host: string;

    private app: koa;

    private proxy: httProxy;

    serviceName: string;

    constructor(serviceName: string, config: ClientOpts) {
        this.serviceName = serviceName;
        this.config = config;
        this.eaptain = new EaptainCli(config);
        this.app = new koa();
        this.proxy = httProxy.createProxy();
        this.init();
    }

    init() {
        const router = new koaRouter();
        router.all('/services/:serviceName/*', async (ctx, next) => {
            ctx.respond = false;
            const host = await this.eaptain.randomClient(ctx.params.serviceName);
            if (host) {
                ctx.url = `/${ctx.params[0]}`;
                return this.proxy.web(ctx.req, ctx.res, {target: 'http://' + host, ws: true}, (err) => {
                    ctx.res.statusCode = 500;
                    ctx.res.end(err.message);
                });
            }
            return next();
        });
        this.app.use(router.routes());
        this.app.use(router.allowedMethods());
        this.app.use(favicon(path.join(__dirname, '../static/favicon.ico')));
    }

    use(middleware: koa.Middleware) {
        this.app.use(middleware);
    }

    listen(port: number = 8123, host: string = 'localhost') {
        this.port = port;
        this.host = host;
        this.app.listen(port, host);
        this.eaptain.start({
            host: this.host,
            port: this.port,
            serviceName: this.serviceName,
            ms: 1000 * 3
        })
    }
}