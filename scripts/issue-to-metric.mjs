import fs from "node:fs/promises";
import path from "node:path";

const SECTION_REGEX = /^###\s+(.+)\n([\s\S]*?)(?=\n###\s+|\n?$)/gm;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SECTION_KEYS = {
  "Metric title": "title",
  "Metric id": "id",
  "SSDLC phase": "phase",
  "Description": "description",
  "Measurement": "measurement",
  "Rationale": "rationale",
  "Tags (comma-separated)": "tags",
  "Related tools (comma-separated)": "related_tools",
  "Depends on (comma-separated metric ids)": "depends_on",
  "Thresholds (one per line)": "thresholds",
  "References (one URL per line)": "references",
  "Notes": "notes",
};

function parseSections(body) {
  const sections = {};
  for (const match of body.matchAll(SECTION_REGEX)) {
    const label = match[1].trim();
    const value = match[2].trim();
    sections[label] = value === "_No response_" ? "" : value;
  }
  return sections;
}

function parseList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLines(value) {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseThresholds(value) {
  const lines = parseLines(value);
  return lines.map((line) => {
    const [name, val, desc] = line.split("|").map((part) => part.trim());
    if (!name || !val) {
      throw new Error(`Invalid threshold line: ${line}`);
    }
    return {
      name,
      value: val,
      description: desc || undefined,
    };
  });
}

function ensureId(id) {
  if (!id || !ID_PATTERN.test(id)) {
    throw new Error("Metric id must be kebab-case (lowercase letters, numbers, hyphens).");
  }
}

function buildFrontmatter(data) {
  const lines = ["---"];
  lines.push(`id: ${data.id}`);
  lines.push(`title: ${data.title}`);
  lines.push(`phase: ${data.phase}`);

  if (data.tags.length) {
    lines.push("tags:");
    for (const tag of data.tags) {
      lines.push(`  - ${tag}`);
    }
  }

  if (data.related_tools.length) {
    lines.push("related_tools:");
    for (const tool of data.related_tools) {
      lines.push(`  - ${tool}`);
    }
  }

  if (data.depends_on.length) {
    lines.push("depends_on:");
    for (const dep of data.depends_on) {
      lines.push(`  - ${dep}`);
    }
  }

  if (data.thresholds.length) {
    lines.push("thresholds:");
    for (const threshold of data.thresholds) {
      lines.push(`  - name: ${threshold.name}`);
      lines.push(`    value: ${JSON.stringify(threshold.value)}`);
      if (threshold.description) {
        lines.push(`    description: ${threshold.description}`);
      }
    }
  }

  if (data.references.length) {
    lines.push("references:");
    for (const ref of data.references) {
      lines.push(`  - ${ref}`);
    }
  }

  lines.push("---");
  return lines.join("\n");
}

function buildBody(data) {
  const sections = ["# Description", data.description || "TBD"];

  if (data.measurement) {
    sections.push("", "# Measurement", data.measurement);
  }

  if (data.rationale) {
    sections.push("", "# Rationale", data.rationale);
  }

  if (data.notes) {
    sections.push("", "# Notes", data.notes);
  }

  return sections.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const issueFileIndex = args.indexOf("--issue-file");
  const metricsDirIndex = args.indexOf("--metrics-dir");

  if (issueFileIndex === -1) {
    throw new Error("--issue-file is required");
  }

  const issueFile = args[issueFileIndex + 1];
  const metricsDir = metricsDirIndex === -1 ? "metrics" : args[metricsDirIndex + 1];

  const body = await fs.readFile(issueFile, "utf8");
  const sections = parseSections(body);

  const data = {
    title: sections["Metric title"] || "",
    id: sections["Metric id"] || "",
    phase: sections["SSDLC phase"] || "",
    description: sections["Description"] || "",
    measurement: sections["Measurement"] || "",
    rationale: sections["Rationale"] || "",
    notes: sections["Notes"] || "",
    tags: parseList(sections["Tags (comma-separated)"] || ""),
    related_tools: parseList(sections["Related tools (comma-separated)"] || ""),
    depends_on: parseList(sections["Depends on (comma-separated metric ids)"] || ""),
    thresholds: parseThresholds(sections["Thresholds (one per line)"] || ""),
    references: parseLines(sections["References (one URL per line)"] || ""),
  };

  if (!data.title || !data.id || !data.phase || !data.description) {
    throw new Error("Missing required fields: title, id, phase, description.");
  }

  ensureId(data.id);

  const fileName = `${data.id}.md`;
  const filePath = path.join(metricsDir, fileName);
  try {
    await fs.access(filePath);
    throw new Error(`Metric file already exists: ${fileName}`);
  } catch (err) {
    if (err?.code !== "ENOENT") {
      throw err;
    }
  }

  const frontmatter = buildFrontmatter(data);
  const bodyContent = buildBody(data);
  const content = `${frontmatter}\n\n${bodyContent}\n`;

  await fs.writeFile(filePath, content, "utf8");

  const branchName = `metric/${data.id}`;

  console.log(`METRIC_ID=${data.id}`);
  console.log(`METRIC_PATH=${filePath}`);
  console.log(`BRANCH_NAME=${branchName}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
