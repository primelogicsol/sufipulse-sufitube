type WorkflowStep = {
  id: string;
  rank: number;
  sectionId: string;
  title: string;
  done: boolean;
  detail: string;
  whatItDoes: string;
  whyImportant: string;
  whatCanGoWrong: string;
  whyNow: string;
  actionLabel: string;
};

type Props = {
  completedWorkflowSteps: number;
  workflowSteps: WorkflowStep[];
  workflowProgressPercent: number;
  workflowStateMessage: string;
  carryForwardNotice: string | null;
  nextWorkflowStep: WorkflowStep | null;
  openWorkflowStepId: string | null;
  onApplyPreviousDefaults: () => void;
  onDoNext: () => void;
  onRunWorkflowAction: (sectionId: string) => void;
  onToggleStepGuide: (stepId: string) => void;
};

export function WorkflowAssistantSection({
  completedWorkflowSteps,
  workflowSteps,
  workflowProgressPercent,
  workflowStateMessage,
  carryForwardNotice,
  nextWorkflowStep,
  openWorkflowStepId,
  onApplyPreviousDefaults,
  onDoNext,
  onRunWorkflowAction,
  onToggleStepGuide,
}: Props) {
  return (
    <div className="mb-6 p-4 dashboard-card" style={{ border: '1px solid var(--dash-accent-muted)' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Workflow Assistant</h2>
          <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
            Action-aware guidance for release completion. Progress: {completedWorkflowSteps}/{workflowSteps.length} ({workflowProgressPercent}%).
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>{workflowStateMessage}</p>
          {carryForwardNotice && (
            <p className="text-xs mt-1" style={{ color: 'var(--dash-status-approved)' }}>{carryForwardNotice}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApplyPreviousDefaults}
            className="dashboard-btn-secondary px-3 py-2 text-sm"
          >
            Apply Previous Defaults
          </button>
          <button
            type="button"
            onClick={onDoNext}
            className="dashboard-btn-primary px-3 py-2 text-sm disabled:opacity-50"
            disabled={!nextWorkflowStep}
          >
            {nextWorkflowStep ? `Do Next: ${nextWorkflowStep.actionLabel}` : 'All Workflow Steps Completed'}
          </button>
        </div>
      </div>

      <div className="h-2 rounded mb-3" style={{ backgroundColor: 'var(--dash-bg-hover)' }}>
        <div
          className="h-2 rounded"
          style={{
            width: `${workflowProgressPercent}%`,
            backgroundColor: workflowProgressPercent === 100 ? 'var(--dash-status-approved)' : 'var(--dash-accent)',
            transition: 'width 200ms ease',
          }}
        />
      </div>

      {nextWorkflowStep && (
        <div className="mb-3 p-3 rounded" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Recommended Next Step: {nextWorkflowStep.title}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--dash-text-muted)' }}>{nextWorkflowStep.detail}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--dash-text-secondary)' }}>Why now: {nextWorkflowStep.whyNow}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {workflowSteps.map((step) => (
          <div
            key={step.id}
            className="p-2 rounded"
            style={{
              border: `1px solid ${step.done ? 'var(--dash-status-approved)' : (step.id === openWorkflowStepId ? 'var(--dash-accent)' : 'var(--dash-border)')}`,
              backgroundColor: step.done ? 'var(--dash-status-approved-bg)' : 'var(--dash-bg-secondary)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--dash-text-muted)' }}>Step {step.rank}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--dash-text-primary)' }}>
                  {step.done ? 'Done' : 'Pending'}: {step.title}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRunWorkflowAction(step.sectionId)}
                  className="dashboard-btn-secondary px-2 py-1 text-xs"
                >
                  {step.actionLabel}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStepGuide(step.id)}
                  className="dashboard-btn-secondary px-2 py-1 text-xs"
                >
                  {step.id === openWorkflowStepId ? 'Hide Guide' : 'Show Guide'}
                </button>
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--dash-text-muted)' }}>{step.detail}</p>
            {step.id === openWorkflowStepId && (
              <div className="mt-2 p-2 rounded" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-hover)' }}>
                <p className="text-xs" style={{ color: 'var(--dash-text-primary)' }}><strong>What this does:</strong> {step.whatItDoes}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--dash-text-primary)' }}><strong>Why this is important:</strong> {step.whyImportant}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--dash-status-pending)' }}><strong>What can go wrong:</strong> {step.whatCanGoWrong}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
