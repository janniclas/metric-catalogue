import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw[] = [
  {
    path: "/propose-auth",
    name: "propose-auth",
    component: () => import("./ProposeMetricAuthView.vue"),
  },
];
