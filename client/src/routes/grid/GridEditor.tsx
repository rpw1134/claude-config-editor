import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { useShell } from '../../contexts/ShellContext';
import { decodeProject, encodeProject } from '../../lib/navigation';
import { useGridEditor } from '../../hooks/useGridEditor';
import { GridTopBar, type GridTabId } from './GridTopBar';
import { GridNodesPanel } from './GridNodesPanel';
import { GridCanvas } from './GridCanvas';
import { HistoryTab } from './HistoryTab';
import { SettingsTab } from './SettingsTab';
import { EdgeDescriptionModal } from '../../components/Grid/EdgeDescriptionModal';

function GridEditorInner({
  projectPath,
  gridName,
}: {
  projectPath: string;
  gridName: string;
}) {
  const navigate = useNavigate();
  const { showToast, onBumpGridsRefresh, onBumpVcRefresh } = useShell();
  const { screenToFlowPosition } = useReactFlow();
  const [activeTab, setActiveTab] = useState<GridTabId>('editor');
  const [nodesPanelRefreshKey, setNodesPanelRefreshKey] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    nodes,
    edges,
    loading,
    saving,
    dirty,
    canUndo,
    pendingConnection,
    gridCreatedAt,
    historySnapshots,
    historyVersion,
    onNodesChange,
    onEdgesChange,
    requestConnection,
    confirmConnection,
    cancelConnection,
    addNode,
    updateEdge,
    undo,
    restoreTo,
    save,
  } = useGridEditor(projectPath, gridName, (msg) => showToast(msg, 'error'));

  // historyVersion is consumed here so the history tab re-renders when it changes
  void historyVersion;

  const handleSave = useCallback(async () => {
    try {
      await save(nodes, edges);
      onBumpGridsRefresh();
      onBumpVcRefresh();
      showToast('Grid saved');
    } catch {
      showToast('Save failed');
    }
  }, [save, nodes, edges, onBumpGridsRefresh, onBumpVcRefresh, showToast]);

  // CMD+S to save, CMD+Z to undo (skip when focused on text inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey) return;
      const tag = document.activeElement?.tagName;
      if (e.key === 's') {
        e.preventDefault();
        if (dirty && !saving) handleSave();
      } else if (e.key === 'z') {
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, undo, dirty, saving]);

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

      const offsetRaw = e.dataTransfer.getData('application/drag-offset');
      const { offsetX = 0, offsetY = 0 } = offsetRaw
        ? (JSON.parse(offsetRaw) as { offsetX: number; offsetY: number })
        : {};

      addNode(type, name, screenToFlowPosition({ x: e.clientX - offsetX, y: e.clientY - offsetY }));
    },
    [screenToFlowPosition, addNode],
  );

  const handleDeleted = useCallback(() => {
    onBumpGridsRefresh();
    onBumpVcRefresh();
    navigate(`/${encodeProject(projectPath)}/grids`);
  }, [onBumpGridsRefresh, onBumpVcRefresh, navigate, projectPath]);

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
        canUndo={canUndo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => navigate(`/${encodeProject(projectPath)}/grids`)}
        onSave={handleSave}
        onUndo={undo}
      />

      {activeTab === 'editor' && (
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
            onUpdateEdge={updateEdge}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <HistoryTab
          snapshots={historySnapshots}
          currentNodeCount={nodes.length}
          currentEdgeCount={edges.length}
          onRestore={restoreTo}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          projectPath={projectPath}
          gridName={gridName}
          createdAt={gridCreatedAt}
          onDeleted={handleDeleted}
          showToast={showToast}
        />
      )}

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
