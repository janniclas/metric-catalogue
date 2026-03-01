import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import OverviewView from "./views/OverviewView.vue";
import AboutView from "./views/AboutView.vue";
import MetricsView from "./views/MetricsView.vue";
import MetricDetailView from "./views/MetricDetailView.vue";
import MetricGraphView from "./views/MetricGraphView.vue";
import { FEATURE_AUTH_PROPOSE_METRIC } from "./lib/featureFlags";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "overview",
    component: OverviewView,
  },
  {
    path: "/about",
    name: "about",
    component: AboutView,
  },
  {
    path: "/metrics",
    name: "metrics",
    component: MetricsView,
  },
  {
    path: "/metrics/:id",
    name: "metric-detail",
    component: MetricDetailView,
  },
  {
    path: "/graph",
    name: "metric-graph",
    component: MetricGraphView,
  },
];

if (FEATURE_AUTH_PROPOSE_METRIC) {
  const { authRoutes } = await import("./features/authPropose/routes");
  routes.push(...authRoutes);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
