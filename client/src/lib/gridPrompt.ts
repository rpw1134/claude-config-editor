import type { GridNode, GridEdge } from '../types/grids';

export function generateOrchestratorPrompt(
  gridName: string,
  nodes: GridNode[],
  edges: GridEdge[],
): string {
  const orchestratorNode = nodes.find((n) => n.type === 'orchestrator');
  if (!orchestratorNode) return '';

  const agentNodes = nodes.filter((n) => n.type === 'agent');
  const skillNodes = nodes.filter((n) => n.type === 'skill');

  const orchToAgent = edges.filter((e) => {
    const src = nodes.find((n) => n.id === e.source);
    const tgt = nodes.find((n) => n.id === e.target);
    return src?.type === 'orchestrator' && tgt?.type === 'agent';
  });

  if (agentNodes.length === 0) {
    return `---
name: ${gridName}
description: Orchestrator agent for the ${gridName} grid. Routes tasks to specialized subagents.
---

You are the orchestrator for the **${gridName}** system. Your only job is routing — you delegate every task to the appropriate subagent and synthesize their results. You do not perform tasks directly.

No agents have been connected yet. Add agent nodes to this grid to enable routing.`;
  }

  const agentLines = orchToAgent.map((edge) => {
    const agent = nodes.find((n) => n.id === edge.target);
    if (!agent) return '';
    const agentName = agent.data.agentName ?? agent.data.label;
    const when = edge.data.description || 'when appropriate';

    const agentToSkillEdges = edges.filter((e) => {
      const src = nodes.find((n) => n.id === e.source);
      return src?.id === agent.id;
    });

    const skillInstructions = agentToSkillEdges
      .map((se) => {
        const skill = nodes.find((n) => n.id === se.target);
        if (!skill) return '';
        const skillName = skill.data.skillName ?? skill.data.label;
        const skillWhen = se.data.description || 'when relevant';
        return `  - Also invoke the **${skillName}** skill ${skillWhen}.`;
      })
      .filter(Boolean)
      .join('\n');

    const base = `- Delegate to **${agentName}** ${when}.`;
    return skillInstructions ? `${base}\n${skillInstructions}` : base;
  });

  const unusedAgents = agentNodes.filter(
    (a) => !orchToAgent.find((e) => e.target === a.id),
  );
  const unusedSkills = skillNodes.filter(
    (s) => !edges.find((e) => e.target === s.id),
  );

  const lines: string[] = [
    `---`,
    `name: ${gridName}`,
    `description: Orchestrator agent for the ${gridName} grid. Routes tasks to specialized subagents.`,
    `---`,
    ``,
    `You are the orchestrator for the **${gridName}** system. Your only job is routing — you delegate every task to the appropriate subagent and synthesize their results. You do not perform tasks directly.`,
    ``,
    `## Routing rules`,
    ``,
    ...agentLines,
  ];

  if (unusedAgents.length > 0) {
    lines.push('');
    lines.push('## Available agents (not yet connected)');
    lines.push('');
    unusedAgents.forEach((a) => {
      lines.push(`- **${a.data.agentName ?? a.data.label}**`);
    });
  }

  if (unusedSkills.length > 0) {
    lines.push('');
    lines.push('## Available skills (not yet connected)');
    lines.push('');
    unusedSkills.forEach((s) => {
      lines.push(`- **${s.data.skillName ?? s.data.label}**`);
    });
  }

  return lines.join('\n');
}
