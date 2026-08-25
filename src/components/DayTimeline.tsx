import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { TimelineTaskCard } from "./TimelineTaskCard";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { Subtask, Task } from "../types/task";

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 64;
const PX_PER_MIN = HOUR_HEIGHT / 60;
const DEFAULT_DURATION_MIN = 45;
const SNAP_MIN = 15;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
const TOTAL_HEIGHT = TOTAL_MIN * PX_PER_MIN;

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

const snap = (minutes: number): number => Math.round(minutes / SNAP_MIN) * SNAP_MIN;

interface Placement {
  task: Task;
  top: number;
  height: number;
  left: number;
  width: number;
}

const layoutPlacements = (scheduled: Task[]): Placement[] => {
  const sorted = [...scheduled].sort((a, b) => timeToMinutes(a.time!) - timeToMinutes(b.time!));
  const columnEnds: number[] = [];
  const raw = sorted.map((task) => {
    const start = timeToMinutes(task.time!);
    const end = start + DEFAULT_DURATION_MIN;
    let col = columnEnds.findIndex((ce) => ce <= start);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[col] = end;
    }
    return { task, start, end, col };
  });
  const totalColumns = Math.max(1, columnEnds.length);
  return raw.map(({ task, start, col }) => ({
    task,
    top: (start - START_HOUR * 60) * PX_PER_MIN,
    height: DEFAULT_DURATION_MIN * PX_PER_MIN - 3,
    left: (col / totalColumns) * 100,
    width: 100 / totalColumns,
  }));
};

interface DayTimelineProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  onReschedule: (id: string, time: string | null) => void;
  onQuickAddAt: (time: string) => void;
  aiLimit: AiLimit;
}

interface DragState {
  taskId: string;
  startClientY: number;
  moved: boolean;
  previewMinutes: number | null;
  insideTimeline: boolean;
}

export const DayTimeline = ({
  tasks,
  onToggle,
  onRemove,
  onSetSubtasks,
  onToggleSubtask,
  onReschedule,
  onQuickAddAt,
  aiLimit,
}: DayTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    taskId: string;
    top: number;
    inside: boolean;
  } | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const scheduled = useMemo(() => tasks.filter((t) => t.time), [tasks]);
  const unscheduled = useMemo(() => tasks.filter((t) => !t.time), [tasks]);
  const placements = useMemo(() => layoutPlacements(scheduled), [scheduled]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;
  const nowTop = (nowMinutes - START_HOUR * 60) * PX_PER_MIN;

  const finishDrag = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    const drag = dragRef.current;
    dragRef.current = null;
    setDragPreview(null);
    if (!drag) return;
    if (!drag.moved) {
      return; // treat as a plain click; card's own toggle handles expand
    }
    if (drag.previewMinutes === null || !drag.insideTimeline) {
      onReschedule(drag.taskId, null);
    } else {
      onReschedule(drag.taskId, minutesToTime(drag.previewMinutes));
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = e.clientY - drag.startClientY;
    if (Math.abs(dy) > 5) drag.moved = true;
    if (!drag.moved || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const inside = e.clientY >= rect.top && e.clientY <= rect.bottom;
    const y = clamp(e.clientY - rect.top, 0, TOTAL_HEIGHT);
    const minutes = clamp(snap(START_HOUR * 60 + y / PX_PER_MIN), START_HOUR * 60, END_HOUR * 60);
    drag.previewMinutes = minutes;
    drag.insideTimeline = inside;
    setDragPreview({ taskId: drag.taskId, top: (minutes - START_HOUR * 60) * PX_PER_MIN, inside });
  };

  const handlePointerUp = () => finishDrag();

  const startDrag = (task: Task, clientY: number) => {
    dragRef.current = {
      taskId: task.id,
      startClientY: clientY,
      moved: false,
      previewMinutes: null,
      insideTimeline: true,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleGridClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = timelineRef.current!.getBoundingClientRect();
    const y = clamp(e.clientY - rect.top, 0, TOTAL_HEIGHT);
    const minutes = clamp(snap(START_HOUR * 60 + y / PX_PER_MIN), START_HOUR * 60, END_HOUR * 60);
    onQuickAddAt(minutesToTime(minutes));
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewportRef.current) return;
    const target = clamp(nowTop - 120, 0, TOTAL_HEIGHT);
    viewportRef.current.scrollTo({ top: target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="day-timeline">
      <div className="timeline-viewport" ref={viewportRef}>
        <div className="timeline-scroll" ref={timelineRef} style={{ height: TOTAL_HEIGHT }}>
          <div className="timeline-hours" onClick={handleGridClick}>
            {hours.map((hour) => (
              <div className="timeline-hour" key={hour} style={{ height: HOUR_HEIGHT }}>
                <span className="timeline-hour-label">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>
          {showNowLine && (
            <div className="timeline-now-line" style={{ top: nowTop }}>
              <span className="timeline-now-dot" />
            </div>
          )}
          {dragPreview?.inside && (
            <div className="timeline-drop-preview" style={{ top: dragPreview.top }} />
          )}
          {placements.map(({ task, top, height, left, width }) => (
            <TimelineTaskCard
              key={task.id}
              task={task}
              style={{
                position: "absolute",
                top,
                height,
                left: `calc(${left}% + 68px)`,
                width: `calc(${width}% - 68px - 6px)`,
                opacity: dragPreview?.taskId === task.id ? 0.35 : 1,
              }}
              isDragging={dragPreview?.taskId === task.id}
              onToggle={onToggle}
              onRemove={onRemove}
              onSetSubtasks={onSetSubtasks}
              onToggleSubtask={onToggleSubtask}
              aiLimit={aiLimit}
              onDragStart={startDrag}
            />
          ))}
        </div>
      </div>

      <div className="timeline-backlog">
        <p className="timeline-backlog-label">
          Unscheduled {unscheduled.length > 0 ? `(${unscheduled.length})` : ""}
        </p>
        {unscheduled.length === 0 ? (
          <p className="timeline-backlog-hint">Everything's on the clock. Nice.</p>
        ) : (
          <>
            <p className="timeline-backlog-hint">Drag onto the timeline to give it a time.</p>
            {unscheduled.map((task) => (
              <TimelineTaskCard
                key={task.id}
                task={task}
                compact
                isDragging={dragPreview?.taskId === task.id}
                onToggle={onToggle}
                onRemove={onRemove}
                onSetSubtasks={onSetSubtasks}
                onToggleSubtask={onToggleSubtask}
                aiLimit={aiLimit}
                onDragStart={startDrag}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};
