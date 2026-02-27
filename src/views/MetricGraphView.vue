<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import * as d3 from "d3";
import { useMetricsCatalogue } from "../lib/useMetricsCatalogue";
import { renderMarkdown } from "../lib/markdown";
import type { Metric, Phase } from "../lib/metrics";

const { metrics, phases, loading, error, metricById, phaseLabelMap } = useMetricsCatalogue();
const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const containerWidth = ref(0);
const showAll = ref(false);
const selectedMetricId = ref<string | null>(null);

const maxInitialNodes = 30;

const displayedMetrics = computed(() => {
  if (showAll.value || metrics.value.length <= maxInitialNodes) {
    return metrics.value;
  }
  return metrics.value.slice(0, maxInitialNodes);
});

const isLimited = computed(() => metrics.value.length > maxInitialNodes && !showAll.value);

const phaseColorMap = computed(() => {
  const domain = phases.value.map((phase) => phase.id);
  const scale = d3.scaleOrdinal<string, string>(d3.schemeTableau10).domain(domain);
  const map = new Map<string, string>();
  for (const phase of phases.value) {
    map.set(phase.id, scale(phase.id));
  }
  return map;
});

type GraphNode = d3.SimulationNodeDatum & {
  id: string;
  label: string;
  phase: string;
};

type GraphLink = d3.SimulationLinkDatum<GraphNode> & {
  source: string | GraphNode;
  target: string | GraphNode;
};

const nodes = computed<GraphNode[]>(() =>
  displayedMetrics.value.map((metric) => ({
    id: metric.id,
    label: metric.title,
    phase: metric.phase,
  })),
);

const links = computed<GraphLink[]>(() => {
  const visibleIds = new Set(displayedMetrics.value.map((metric) => metric.id));
  const result: GraphLink[] = [];
  for (const metric of displayedMetrics.value) {
    for (const dependency of metric.depends_on ?? []) {
      if (!visibleIds.has(dependency)) continue;
      if (dependency === metric.id) continue;
      result.push({ source: dependency, target: metric.id });
    }
  }
  return result;
});

const selectedMetric = computed(() => {
  if (!selectedMetricId.value) return null;
  return metricById.value.get(selectedMetricId.value) ?? null;
});

const selectedDescription = computed(() => {
  if (!selectedMetric.value) return "";
  return extractDescription(selectedMetric.value);
});

function extractDescription(metric: Metric): string {
  const markdown = metric.markdown ?? "";
  if (typeof document !== "undefined") {
    const html = renderMarkdown(markdown);
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const firstParagraph = temp.querySelector("p");
    const text = (firstParagraph?.textContent ?? temp.textContent ?? "").trim();
    return text;
  }

  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"));
  return lines[0]?.replace(/[*_`>]/g, "").trim() ?? "";
}

let simulation: d3.Simulation<GraphNode, undefined> | null = null;

function stopSimulation() {
  simulation?.stop();
  simulation = null;
}

function renderGraph() {
  if (!svgRef.value || !containerRef.value) return;

  const width = containerRef.value.clientWidth || 720;
  const height = Math.max(420, Math.round(width * 0.64));

  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const zoomGroup = svg.append("g").attr("class", "catalogue-graph__viewport");

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 2.4])
    .on("zoom", (event) => {
      zoomGroup.attr("transform", event.transform);
    });

  svg.call(zoom as unknown as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void);

  stopSimulation();

  const nodeList = nodes.value.map((node) => ({ ...node }));
  const linkList = links.value.map((link) => ({ ...link }));

  const linkSelection = zoomGroup
    .append("g")
    .attr("class", "catalogue-graph__links")
    .selectAll("line")
    .data(linkList)
    .join("line")
    .attr("stroke", "rgba(90, 76, 242, 0.18)")
    .attr("stroke-width", 1.3);

  const nodeSelection = zoomGroup
    .append("g")
    .attr("class", "catalogue-graph__nodes")
    .selectAll("g")
    .data(nodeList)
    .join("g")
    .attr("class", (node) =>
      [
        "catalogue-graph__node",
        node.id === selectedMetricId.value ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" "),
    )
    .style("cursor", "pointer")
    .on("click", (_, node) => {
      selectedMetricId.value = node.id;
    })
    ;

  nodeSelection
    .append("circle")
    .attr("r", 12)
    .attr("fill", (node) => phaseColorMap.value.get(node.phase) ?? "#7a6bff")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2);

  nodeSelection
    .append("text")
    .attr("x", 16)
    .attr("y", 4)
    .text((node) => node.label);

  simulation = d3
    .forceSimulation(nodeList)
    .force(
      "link",
      d3
        .forceLink<GraphNode, GraphLink>(linkList)
        .id((node) => node.id)
        .distance(90)
        .strength(0.8),
    )
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(22))
    .on("tick", () => {
      linkSelection
        .attr("x1", (link) => (link.source as GraphNode).x ?? 0)
        .attr("y1", (link) => (link.source as GraphNode).y ?? 0)
        .attr("x2", (link) => (link.target as GraphNode).x ?? 0)
        .attr("y2", (link) => (link.target as GraphNode).y ?? 0);

      nodeSelection.attr("transform", (node) => `translate(${node.x ?? 0}, ${node.y ?? 0})`);
    });
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth || 0;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width) {
            containerWidth.value = entry.contentRect.width;
          }
        }
      });
      resizeObserver.observe(containerRef.value);
    }
  }
  void nextTick(renderGraph);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  stopSimulation();
});

watch([nodes, links, containerWidth, showAll, selectedMetricId], () => {
  void nextTick(renderGraph);
});

watch(displayedMetrics, (nextMetrics) => {
  if (!selectedMetricId.value) return;
  if (nextMetrics.some((metric) => metric.id === selectedMetricId.value)) return;
  selectedMetricId.value = null;
});
</script>

<template>
  <section class="catalogue-graph section section--light">
    <div class="container">
      <div class="section-header">
        <div>
          <p class="eyebrow">Catalogue</p>
          <h2>Metrics graph</h2>
        </div>
        <div class="section-subtitle">
          <p>Explore the dependency network across all security metrics.</p>
          <p class="count" v-if="metrics.length">
            {{ metrics.length }} metrics total
          </p>
        </div>
      </div>

      <div v-if="loading" class="state">Loading metrics catalogue…</div>
      <div v-else-if="error" class="state state--error">{{ error }}</div>
      <div v-else class="catalogue-graph__layout">
        <div class="catalogue-graph__surface">
          <div class="catalogue-graph__controls">
            <p v-if="isLimited" class="catalogue-graph__notice">
              Showing {{ displayedMetrics.length }} of {{ metrics.length }} metrics. More nodes are
              available.
            </p>
            <button
              v-if="isLimited"
              class="catalogue-graph__action"
              type="button"
              @click="showAll = true"
            >
              Show all metrics
            </button>
            <p v-else class="catalogue-graph__hint">Scroll or pinch to zoom, drag to pan.</p>
          </div>
          <div ref="containerRef" class="catalogue-graph__canvas">
            <svg ref="svgRef" role="img" aria-label="Metrics dependency graph"></svg>
          </div>
        </div>
        <aside class="catalogue-graph__panel">
          <div v-if="!selectedMetric" class="catalogue-graph__placeholder">
            <p class="eyebrow">Details</p>
            <h3>Select a metric</h3>
            <p>Click a node to see its description and jump to the detailed view.</p>
          </div>
          <div v-else class="catalogue-graph__details">
            <p class="metric-phase">
              {{ phaseLabelMap.get(selectedMetric.phase) ?? selectedMetric.phase }}
            </p>
            <h3>{{ selectedMetric.title }}</h3>
            <p class="metric-id">{{ selectedMetric.id }}</p>
            <p v-if="selectedDescription" class="catalogue-graph__description">
              {{ selectedDescription }}
            </p>
            <RouterLink class="catalogue-graph__link" :to="`/metrics/${selectedMetric.id}`">
              View metric details
            </RouterLink>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
