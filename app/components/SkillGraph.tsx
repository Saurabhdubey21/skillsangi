type NodeState = "done" | "today" | "next";
type GraphNode = { id: string; label: string; x: number; y: number; state: NodeState };

const nodes: GraphNode[] = [
  { id: "arrays", label: "Arrays", x: 60, y: 320, state: "done" },
  { id: "strings", label: "Strings", x: 150, y: 376, state: "done" },
  { id: "hashing", label: "Hashing", x: 170, y: 246, state: "done" },
  { id: "recursion", label: "Recursion", x: 300, y: 310, state: "today" },
  { id: "trees", label: "Trees", x: 310, y: 166, state: "next" },
  { id: "graphs", label: "Graphs", x: 450, y: 236, state: "next" },
  { id: "dp", label: "DP", x: 470, y: 96, state: "next" },
];

const edges: [string, string][] = [
  ["arrays", "hashing"],
  ["strings", "hashing"],
  ["hashing", "recursion"],
  ["hashing", "trees"],
  ["recursion", "trees"],
  ["recursion", "graphs"],
  ["trees", "graphs"],
  ["trees", "dp"],
  ["graphs", "dp"],
];

const byId: Record<string, GraphNode> = Object.fromEntries(
  nodes.map((n) => [n.id, n])
);

export default function SkillGraph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 420"
      className={className}
      role="img"
      aria-label="Sample roadmap: Arrays, Strings and Hashing completed, Recursion in progress, Trees, Graphs and DP coming up"
    >
      {edges.map(([a, b]) => {
        const A = byId[a];
        const B = byId[b];
        const reached = A.state !== "next" && B.state !== "next";
        return (
          <line
            key={`${a}-${b}`}
            x1={A.x}
            y1={A.y}
            x2={B.x}
            y2={B.y}
            className={reached ? "stroke-accent" : "stroke-muted/50"}
            strokeWidth={reached ? 2.5 : 1.5}
            strokeDasharray={reached ? undefined : "4 6"}
            strokeLinecap="round"
          />
        );
      })}

      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
          {n.state === "done" && (
            <>
              <circle r="10" className="fill-accent" />
              <path
                d="M-4.5 0.5l3 3 6-6.5"
                fill="none"
                className="stroke-on-accent"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
          {n.state === "today" && (
            <>
              <circle r="19" fill="none" className="stroke-glow animate-pulse" strokeWidth="1.5" opacity="0.5" />
              <circle r="11" className="fill-background stroke-glow" strokeWidth="3" />
              <circle r="4" className="fill-glow" />
            </>
          )}
          {n.state === "next" && (
            <circle r="8" className="fill-background stroke-muted" strokeWidth="2" />
          )}
          <text
            y={n.state === "today" ? 36 : 28}
            textAnchor="middle"
            fontSize="13"
            fontWeight={500}
            className={n.state === "next" ? "fill-muted" : "fill-foreground"}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}