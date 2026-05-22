import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { useShell } from '../../contexts/ShellContext';
import { decodeProject, encodeProject } from '../../lib/navigation';
import { useGridEditor } from '../../hooks/useGridEditor';
import { GridTopBar } from './GridTopBar';
import { GridNodesPanel } from './GridNodesPanel';
import { GridCanvas } from './GridCanvas';
import { GridPromptPreview } from './GridPromptPreview';
import { EdgeDescriptionModal } from '../../components/Grid/EdgeDescriptionModal';

function GridEditorInner({
  projectPath,
  gridName,
}: {
  projectPath: string;
  gridName: string;
}) {
  const navigate = useNavigate();
  const { showToast, onBumpGridsRefresh } = useShell();
  const { screenToFlowPosition } = useReactFlow();
  const [previewOpen, setPreviewOpen] = useState(true);
  const [nodesPanelRefreshKey, setNodesPanelRefreshKey] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    nodes,
    edges,
    loading,
    saving,
    dirty,
    pendingConnection,
    generatedPrompt,
    onNodesChange,
    onEdgesChange,
    requestConnection,
    confirmConnection,
    cancelConnection,
    addNode,
    save,
  } = useGridEditor(projectPath, gridName);

  const handleSave = useCallback(async () => {
    try {
      await save(nodes, edges);
      onBumpGridsRefresh();
      showToast('Grid saved');
    } catch {
      showToast('Save failed');
    }
  }, [save, nodes, edges, onBumpGridsRefresh, showToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/grid-node-type') as 'agent' | 'skill';
      const name = e.dataTransfer.getData('application/grid-node-name');
      if (!type || !name) return;

      const bounds = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const position = screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      addNode(type, name, position);
    },
    [screenToFlowPosition, addNode],
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <div className="w-5 h-5 rounded-full border-2 border-(--accent)/30 border-t-(--accent) animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-(--bg-base) overflow-hidden">
      <GridTopBar
        gridName={gridName}
        dirty={dirty}
        saving={saving}
        previewOpen={previewOpen}
        onBack={() => navigate(`/${encodeProject(projectPath)}/grids`)}
        onSave={handleSave}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
      />

      <div className="flex flex-1 min-h-0" ref={canvasRef}>
        <GridNodesPanel
          projectPath={projectPath}
          refreshKey={nodesPanelRefreshKey}
          onAgentCreated={() => setNodesPanelRefreshKey((k) => k + 1)}
          onSkillCreated={() => setNodesPanelRefreshKey((k) => k + 1)}
          showToast={showToast}
        />

        <GridCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={requestConnection}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />

        {previewOpen && <GridPromptPreview prompt={generatedPrompt} />}
      </div>

      {pendingConnection && (
        <EdgeDescriptionModal
          onConfirm={confirmConnection}
          onCancel={cancelConnection}
        />
      )}
    </div>
  );
}

export const GridEditor = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const gridName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !gridName) return null;

  return (
    <ReactFlowProvider>
      <GridEditorInner projectPath={projectPath} gridName={gridName} />
    </ReactFlowProvider>
  );
};
