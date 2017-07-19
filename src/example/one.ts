import {Proxy} from '../index'
import * as koaRouter from 'koa-router'
import * as koaBodyParser from 'koa-bodyparser'

const proxy = new Proxy('one', {db: '0'});

const router = new koaRouter();

router.all('*', (ctx: any, next) => {
    console.log(proxy.serviceName, ctx.url, new Date());
    ctx.body = proxy.serviceName + ' - : - ' + ctx.url + ' - : - ' + Date.now() + ' -> ' + JSON.stringify(ctx.request.body || {});
    return next();
});

proxy.use(koaBodyParser());

proxy.use(router.routes());

proxy.use(router.allowedMethods());

proxy.listen(8769, 'localhost');