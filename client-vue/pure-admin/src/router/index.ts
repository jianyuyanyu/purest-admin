// import "@/utils/sso";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { addPathMatch } from "./utils";
import {
  type Router,
  createRouter,
  type RouteRecordRaw,
  type RouteComponent
} from "vue-router";
import {
  ascending,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import { buildHierarchyTree } from "@/utils/tree";
import { isUrl, openLink } from "@pureadmin/utils";

import remainingRouter from "./modules/remaining";
import { useUserStoreHook } from "@/store/modules/user";

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes = [];

Object.keys(modules).forEach(key => {
  routes.push(modules[key].default);
});

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = Object.keys(remainingRouter).map(v => {
  return remainingRouter[v].path;
});

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as any)),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          const top: number =
            document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        }
      }
    });
  }
});

/** 重置路由 */
export function resetRouter() {
  router.getRoutes().forEach(route => {
    const { name, meta } = route;
    if (name && router.hasRoute(name) && meta?.backstage) {
      router.removeRoute(name);
      router.options.routes = formatTwoStageRoutes(
        formatFlatteningRoutes(
          buildHierarchyTree(ascending(routes.flat(Infinity)))
        )
      );
    }
  });
  usePermissionStoreHook().clearAllCachePage();
}

/** 路由白名单 */
const whiteList = ["/login", "/oauth-callback"];

const { VITE_HIDE_HOME } = import.meta.env;

router.beforeEach((to: ToRouteType, _from, next) => {
  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }
  const currentUser = useUserStoreHook().getCurrentUser;
  NProgress.start();
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      if (Title) document.title = `${item.meta.title} | ${Title}`;
      else document.title = item.meta.title as string;
    });
  }
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    // 开启隐藏首页后在浏览器地址栏手动输入首页welcome路由则跳转到404页面
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/welcome") {
      next({ path: "/error/404" });
    }
    // 无权限跳转403页面
    else if (
      to.meta?.permissions &&
      !isOneOfArray(to.meta?.permissions, currentUser?.permissions)
    ) {
      next({ path: "/error/403" });
    } else {
      whiteList.includes(to.fullPath) ? next(_from.fullPath) : next();
    }
  }
  if (currentUser) {
    if (_from?.name) {
      // name为超链接
      if (externalLink) {
        openLink(to?.name as string);
        NProgress.done();
      } else {
        toCorrectRoute();
      }
    } else {
      // 刷新
      if (
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login"
      ) {
        usePermissionStoreHook().handleWholeMenus([]);
        addPathMatch();
        if (!useMultiTagsStoreHook().getMultiTagsCache) {
          const { path } = to;
          const route = findRouteByPath(
            path,
            router.options.routes[0].children
          );
          // query、params模式路由传参数的标签页不在此处处理
          if (route && route.meta?.title) {
            useMultiTagsStoreHook().handleTags("push", {
              path: route.path,
              name: route.name,
              meta: route.meta
            });
          }
        }
      }
      toCorrectRoute();
    }
  } else {
    if (to.path !== "/login") {
      if (whiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        next({ path: "/login" });
      }
    } else {
      next();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
