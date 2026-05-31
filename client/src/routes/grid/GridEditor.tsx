import { useCallback, useEffect, useState } from 'react';
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
import type { GridNode } from '../../types/grids';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    nodes,
    edges,
    loading,
    saving,
    dirty,
    canUndo,
    pendingConnection,
    gridCreatedAt,
    onNodesChange,
    onEdgesChange,
    requestConnection,
    confirmConnection,
    cancelConnection,
    addNode,
    updateEdge,
    undo,
    save,
  } = useGridEditor(projectPath, gridName, (msg) => showToast(msg, 'error'));

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
      const type = e.dataTransfer.getData('application/grid-node-type') as GridNode['type'];
      const name = e.dataTransfer.getData('application/grid-node-name');
      if (!type || !name) return;

      const offsetRaw = e.dataTransfer.getData('application/drag-offset');
      const { offsetX = 0, offsetY = 0 } = offsetRaw
        ? (JSON.parse(offsetRaw) as { offsetX: number; offsetY: number })
        : {};

      const extraRaw = e.dataTransfer.getData('application/grid-node-extra');
      const extra = extraRaw ? (JSON.parse(extraRaw) as Partial<GridNode['data']>) : undefined;

      addNode(type, name, screenToFlowPosition({ x: e.clientX - offsetX, y: e.clientY - offsetY }), extra);
    },
    [screenToFlowPosition, addNode],
  );

  const handleHookCreate = useCallback(
    (name: string, event: GridNode['data']['hookEvent'], command: string) => {
      const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      addNode('hook', name, center, { hookEvent: event, hookCommand: command });
    },
    [screenToFlowPosition, addNode],
  );

  // Auto-confirm edges that need no modal (mcp→skill, hook→skill, *→knowledge)
  useEffect(() => {
    if (!pendingConnection?.noModal) return;
    confirmConnection('');
  }, [pendingConnection, confirmConnection]);

  const handleDeleted = useCallback(() => {
    onBumpGridsRefresh();
    onBumpVcRefresh();
    navigate(`/${encodeProject(projectPath)}/grids`);
  }, [onBumpGridsRefresh, onBumpVcRefresh, navigate, projectPath]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--bg-base)">
        <div className="w-5 h-5 rounded-full border-2 border-(--accent)/30 border-t-(--accent) animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-(--bg-base) overflow-hidden">
      {/* Sidebar — always visible, full height */}
      <GridNodesPanel
        gridName={gridName}
        projectPath={projectPath}
        refreshKey={nodesPanelRefreshKey}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onBack={() => navigate(`/${encodeProject(projectPath)}/grids`)}
        onAgentCreated={() => setNodesPanelRefreshKey((k) => k + 1)}
        onSkillCreated={() => setNodesPanelRefreshKey((k) => k + 1)}
        showToast={showToast}
      />

      {/* Right side: navbar + tab content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <GridTopBar
          dirty={dirty}
          saving={saving}
          canUndo={canUndo}
          activeTab={activeTab}
          sidebarCollapsed={sidebarCollapsed}
          onTabChange={setActiveTab}
          onBack={() => navigate(`/${encodeProject(projectPath)}/grids`)}
          onSave={handleSave}
          onUndo={undo}
        />

        {activeTab === 'editor' && (
          <div className="flex flex-1 min-h-0">
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
            projectPath={projectPath}
            gridName={gridName}
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
      </div>

      {pendingConnection && !pendingConnection.noModal && (
        <EdgeDescriptionModal
          sourceType={pendingConnection.sourceType}
          targetType={pendingConnection.targetType}
          sourceLabel={pendingConnection.sourceLabel}
          targetLabel={pendingConnection.targetLabel}
          onConfirm={(description, isKnowledge) => confirmConnection(description, isKnowledge)}
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
