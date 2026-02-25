import { createRouter, createWebHistory } from "vue-router";
import OverviewView from "./views/OverviewView.vue";
import MetricsView from "./views/MetricsView.vue";
import MetricDetailView from "./views/MetricDetailView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "overview",
      component: OverviewView,
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
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
