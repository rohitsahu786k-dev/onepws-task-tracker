import { useMemo, useState } from 'react';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;
const getWorkspaceName = (workspace) => workspace?.name || workspace?.companyName || workspace?.slug || 'Workspace';

const WorkspaceSwitcher = ({ compact = false }) => {
  const user = useAuthStore((state) => state.user);
  const workspace = useAuthStore((state) => state.workspace);
  const setWorkspace = useAuthStore((state) => state.setWorkspace);
  const [open, setOpen] = useState(false);

  const workspaces = useMemo(() => {
    const fromMemberships = (user?.workspaces || [])
      .filter((item) => item?.isActive !== false)
      .map((item) => item.workspace)
      .filter(Boolean);

    const defaultWorkspace = user?.defaultWorkspace ? [user.defaultWorkspace] : [];
    const unique = new Map([...fromMemberships, ...defaultWorkspace].map((item) => [getWorkspaceId(item), item]));
    return [...unique.values()].filter((item) => getWorkspaceId(item));
  }, [user]);

  const selectedId = getWorkspaceId(workspace);
  const selected = workspaces.find((item) => getWorkspaceId(item) === selectedId) || workspace;

  const handleSelect = async (item) => {
    await setWorkspace(item);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 ${compact ? 'max-w-[12rem]' : 'w-full'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building2 size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Workspace</span>
          <span className="block truncate font-semibold">{getWorkspaceName(selected)}</span>
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-72 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="max-h-72 overflow-y-auto p-1">
            {workspaces.map((item) => {
              const id = getWorkspaceId(item);
              const isActive = id === selectedId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-100 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {getWorkspaceName(item).charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{getWorkspaceName(item)}</span>
                    {item?.slug && <span className="block truncate text-xs text-slate-500">/{item.slug}</span>}
                  </span>
                  {isActive && <Check size={16} className="text-primary" />}
                </button>
              );
            })}

            {!workspaces.length && (
              <div className="px-3 py-4 text-sm text-slate-500">No workspace assigned yet.</div>
            )}
          </div>

          <Link
            to="/workspaces/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-slate-200 px-3 py-3 text-sm font-medium text-primary hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <Plus size={16} /> Create workspace
          </Link>
        </div>
      )}
    </div>
  );
};

export { WorkspaceSwitcher };
export default WorkspaceSwitcher;
